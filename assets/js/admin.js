(function () {
    'use strict';

    const firebaseConfig = {
        apiKey: "AIzaSyAxmv1QtEMtFU9lHIjFULdlFbjJRn8-Xuo",
        authDomain: "streetfood-bga.firebaseapp.com",
        projectId: "streetfood-bga",
        storageBucket: "streetfood-bga.firebasestorage.app",
        messagingSenderId: "29645475094",
        appId: "1:29645475094:web:7e0618d42d61ee484c1437",
        measurementId: "G-54479KKM8V"
    };

    if (typeof firebase === 'undefined') {
        document.getElementById('orders-grid').innerHTML =
            '<div class="empty-state empty-state--error"><i class="fas fa-exclamation-triangle"></i><p>Firebase no está cargado</p></div>';
        return;
    }

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    let adminStarted = false;

    function initAdminPanel() {
        if (adminStarted) return;
        adminStarted = true;

    const grid = document.getElementById('orders-grid');
    const totalPeriodo = document.getElementById('total-periodo');
    const countNuevos = document.getElementById('count-nuevos');
    const countPendientes = document.getElementById('count-pendientes');
    const countEntregados = document.getElementById('count-entregados');
    const countCancelados = document.getElementById('count-cancelados');
    const ticketPromedio = document.getElementById('ticket-promedio');
    const filterBtns = document.querySelectorAll('.admin-filter');
    const dateFilterBtns = document.querySelectorAll('.admin-date-filter');
    let allOrderDocs = [];
    let currentFilter = 'todos';
    let currentDateRange = 'hoy';

    const STATUS_MAP = {
        nuevo: { label: 'Nuevo', class: 'status-badge--nuevo', next: 'aceptado', btn: 'Aceptar Pedido', btnClass: 'btn--aceptar' },
        aceptado: { label: 'Aceptado', class: 'status-badge--aceptado', next: 'listo', btn: 'Marcar Listo', btnClass: 'btn--listo' },
        listo: { label: 'Listo', class: 'status-badge--listo', next: 'entregado', btn: 'Entregado', btnClass: 'btn--entregar' },
        entregado: { label: 'Entregado', class: 'status-badge--entregado', next: null, btn: null, btnClass: '' },
        cancelado: { label: 'Cancelado', class: 'status-badge--cancelado', next: null, btn: null, btnClass: '' }
    };

    function formatTime(iso) {
        const d = new Date(iso);
        return d.toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function isInDateRange(iso) {
        if (currentDateRange === 'todos') return true;

        const d = new Date(iso);
        const today = startOfDay(new Date());
        const orderDay = startOfDay(d);

        if (currentDateRange === 'hoy') {
            return orderDay.getTime() === today.getTime();
        }

        if (currentDateRange === 'ayer') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return orderDay.getTime() === yesterday.getTime();
        }

        if (currentDateRange === 'semana') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 6);
            return orderDay >= weekStart && orderDay <= today;
        }

        if (currentDateRange === 'mes') {
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        }

        return true;
    }

    function renderOrder(doc) {
        const data = doc.data();
        const id = doc.id;
        const status = STATUS_MAP[data.estado] || STATUS_MAP.nuevo;

        const card = document.createElement('div');
        card.className = 'order-card order-card--' + (data.estado || 'nuevo');
        card.dataset.id = id;
        card.dataset.estado = data.estado;

        const itemsHtml = data.items.map(function (item) {
            return '<div class="item-row"><span><span class="item-row__qty">' + item.quantity + 'x</span>' + item.name + '</span><span>$' + item.subtotal.toLocaleString() + '</span></div>';
        }).join('');

        let actionsHtml = '';
        if (status.next) {
            actionsHtml = '<button class="' + status.btnClass + '" onclick="avanzarEstado(\'' + id + '\',\'' + status.next + '\')">' + status.btn + '</button>';
        }
        if (data.estado !== 'entregado' && data.estado !== 'cancelado') {
            actionsHtml += '<button class="btn--cancelar" onclick="cancelarPedido(\'' + id + '\')">Cancelar / Nulo</button>';
        }

        const cancelInfo = data.estado === 'cancelado'
            ? '<p><strong>Motivo cancelación:</strong> ' + (data.motivoCancelacion || 'Sin motivo') + '</p>'
            : '';

        card.innerHTML =
            '<div class="order-card__header">' +
            '<div>' +
            '<span class="order-card__number">#' + data.numero + '</span>' +
            '<span class="order-card__client">' + data.cliente + '</span>' +
            '</div>' +
            '<div class="order-card__header-right">' +
            '<span class="order-card__time"><i class="far fa-clock"></i> ' + formatTime(data.creado) + '</span>' +
            '<span class="status-badge ' + status.class + '">' + status.label + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="order-card__body">' +
            '<div class="order-card__info">' +
            '<p><strong>Telefono:</strong> ' + (data.telefono || '\u2014') + '</p>' +
            '<p><strong>Direccion:</strong> ' + (data.direccion || 'Recoge en local') + '</p>' +
            '<p><strong>Tipo:</strong> ' + (data.tipo === 'domicilio' ? 'Domicilio' : 'Recoger') + '</p>' +
            '<p><strong>Pago:</strong> ' + data.pago + '</p>' +
            (data.notas ? '<p><strong>Notas:</strong> ' + data.notas + '</p>' : '') +
            cancelInfo +
            '</div>' +
            '<div class="order-card__items">' +
            '<h4 class="order-card__items-title">Productos</h4>' +
            itemsHtml +
            '<div class="order-card__total"><span>TOTAL</span><span>$' + data.total.toLocaleString() + '</span></div>' +
            '</div>' +
            '</div>' +
            '<div class="order-card__actions">' + actionsHtml + '</div>';

        return card;
    }

    function getDateFilteredDocs(docs) {
        return docs.filter(function (d) { return isInDateRange(d.data().creado); });
    }

    function actualizarStats(docs) {
        const periodDocs = getDateFilteredDocs(docs);
        const entregados = periodDocs.filter(function (d) { return d.data().estado === 'entregado'; });
        const total = entregados.reduce(function (sum, d) { return sum + (d.data().total || 0); }, 0);
        const average = entregados.length ? Math.round(total / entregados.length) : 0;

        totalPeriodo.textContent = '$' + total.toLocaleString();

        const nuevos = periodDocs.filter(function (d) { return d.data().estado === 'nuevo'; }).length;
        const pendientes = periodDocs.filter(function (d) { return d.data().estado === 'aceptado' || d.data().estado === 'listo'; }).length;
        const cancelados = periodDocs.filter(function (d) { return d.data().estado === 'cancelado'; }).length;
        countNuevos.textContent = nuevos;
        countPendientes.textContent = pendientes;
        countEntregados.textContent = entregados.length;
        countCancelados.textContent = cancelados;
        ticketPromedio.textContent = '$' + average.toLocaleString();

        // Payment method breakdown (only delivered orders)
        var pagos = { 'Efectivo': 0, 'Nequi/Daviplata': 0, 'Transferencia': 0, 'Datafono': 0 };
        entregados.forEach(function (d) {
            var pago = d.data().pago || 'Efectivo';
            if (pagos[pago] !== undefined) pagos[pago] += d.data().total || 0;
        });
        document.getElementById('pago-efectivo').textContent = '$' + pagos['Efectivo'].toLocaleString();
        document.getElementById('pago-nequi').textContent = '$' + pagos['Nequi/Daviplata'].toLocaleString();
        document.getElementById('pago-transferencia').textContent = '$' + pagos['Transferencia'].toLocaleString();
        document.getElementById('pago-datafono').textContent = '$' + pagos['Datafono'].toLocaleString();
    }

    function filterOrders(docs) {
        docs = getDateFilteredDocs(docs);

        if (currentFilter === 'nuevo') {
            return docs.filter(function (d) { return d.data().estado === 'nuevo'; });
        }
        if (currentFilter === 'preparacion') {
            return docs.filter(function (d) { return d.data().estado === 'aceptado'; });
        }
        if (currentFilter === 'listo') {
            return docs.filter(function (d) { return d.data().estado === 'listo'; });
        }
        if (currentFilter === 'entregado') {
            return docs.filter(function (d) { return d.data().estado === 'entregado'; });
        }
        if (currentFilter === 'cancelado') {
            return docs.filter(function (d) { return d.data().estado === 'cancelado'; });
        }
        return docs;
    }

    function renderOrders() {
        var docs = filterOrders(allOrderDocs);
        grid.innerHTML = '';

        if (allOrderDocs.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-clock"></i><p>Esperando pedidos...</p></div>';
            return;
        }

        if (docs.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-clock"></i><p>No hay pedidos para este filtro</p></div>';
            return;
        }

        docs.forEach(function (d) {
            var card = renderOrder({ id: d.id, data: d.data });
            grid.appendChild(card);
        });
    }

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filterBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderOrders();
        });
    });

    dateFilterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            dateFilterBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentDateRange = btn.dataset.range;
            renderOrders();
            actualizarStats(allOrderDocs);
        });
    });

    window.avanzarEstado = function (id, nuevoEstado) {
        db.collection('pedidos').doc(id).update({ estado: nuevoEstado }).catch(function (err) {
            console.error('Error actualizando estado:', err);
        });
    };

    window.cancelarPedido = function (id) {
        var motivo = window.prompt('Motivo de cancelación o nulidad:');
        if (motivo === null) return;

        motivo = motivo.trim();
        if (!motivo) {
            window.alert('Debes escribir un motivo para cancelar el pedido.');
            return;
        }

        db.collection('pedidos').doc(id).update({
            estado: 'cancelado',
            motivoCancelacion: motivo,
            canceladoEn: new Date().toISOString()
        }).catch(function (err) {
            console.error('Error cancelando pedido:', err);
        });
    };

    window.exportCSV = function () {
        var docs = filterOrders(allOrderDocs);
        if (docs.length === 0) {
            alert('No hay pedidos para exportar con el filtro actual.');
            return;
        }

        var rows = [['#Pedido', 'Cliente', 'Teléfono', 'Dirección', 'Tipo', 'Pago', 'Notas', 'Total', 'Estado', 'Fecha']];
        docs.forEach(function (d) {
            var data = d.data();
            var fecha = new Date(data.creado);
            rows.push([
                data.numero || '',
                data.cliente || '',
                data.telefono || '',
                data.direccion || '',
                data.tipo === 'domicilio' ? 'Domicilio' : 'Recoger',
                data.pago || '',
                (data.notas || '').replace(/,/g, ';'),
                data.total || 0,
                data.estado || '',
                fecha.toLocaleDateString('es-CO') + ' ' + fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
            ]);
        });

        var csv = rows.map(function (row) { return row.join(','); }).join('\n');
        var bom = '\uFEFF';
        var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'pedidos-' + new Date().toISOString().slice(0, 10) + '.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    window.resetAllData = async function () {
        if (!confirm('\u00bfEst\u00e1s seguro? Se borrar\u00e1n TODOS los pedidos, contactos y se reiniciar\u00e1 el contador. Esta acci\u00f3n NO se puede deshacer.')) return;
        if (!confirm('\u00bfRealmente est\u00e1s seguro? Esta es tu \u00faltima oportunidad.')) return;

        try {
            // 1. Borrar pedidos
            var pedidosSnap = await db.collection('pedidos').get();
            if (!pedidosSnap.empty) {
                var batch = db.batch();
                pedidosSnap.forEach(function (doc) { batch.delete(doc.ref); });
                await batch.commit();
            }

            // 2. Resetear contador
            await db.collection('contadores').doc('pedidos').set({ ultimo: 0 });

            // 3. Borrar contactos
            var contactosSnap = await db.collection('contactos').get();
            if (!contactosSnap.empty) {
                var batch2 = db.batch();
                contactosSnap.forEach(function (doc) { batch2.delete(doc.ref); });
                await batch2.commit();
            }

            alert('Datos reiniciados correctamente. Todos los pedidos y contactos han sido eliminados.');
        } catch (err) {
            console.error('Error al reiniciar datos:', err);
            alert('Error al reiniciar datos: ' + err.message);
        }
    };

    db.collection('pedidos')
        .orderBy('creado', 'desc')
        .onSnapshot(function (snapshot) {
            var docs = [];

            snapshot.forEach(function (doc) { docs.push({ id: doc.id, data: function () { return doc.data(); } }); });
            allOrderDocs = docs;
            renderOrders();
            actualizarStats(docs);
        }, function (err) {
            console.error('Error al cargar pedidos:', err);
            grid.innerHTML = '<div class="empty-state empty-state--error"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar pedidos: ' + err.message + '</p></div>';
        });

    // Contactos
    var contactGrid = document.getElementById('contacts-grid');
    db.collection('contactos')
        .orderBy('creado', 'desc')
        .onSnapshot(function (snapshot) {
            contactGrid.innerHTML = '';
            if (snapshot.empty) {
                contactGrid.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay mensajes aun</p></div>';
                return;
            }
            snapshot.forEach(function (doc) {
                var d = doc.data();
                var card = document.createElement('div');
                card.className = 'contact-card';
                card.innerHTML =
                    '<div class="contact-card__head">' +
                    '<span>' + d.nombre + ' <span class="contact-card__email">&lt;' + d.email + '&gt;</span></span>' +
                    '<span class="contact-card__date">' + formatTime(d.creado) + '</span>' +
                    '</div>' +
                    '<div class="contact-card__subject">' + d.asunto + '</div>' +
                    '<div class="contact-card__message">' + d.mensaje + '</div>';
                contactGrid.appendChild(card);
            });
        }, function (err) {
            console.error('Error al cargar contactos:', err);
            contactGrid.innerHTML = '<div class="empty-state empty-state--error"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar contactos: ' + err.message + '</p></div>';
        });
    }

    document.getElementById('logout-btn')?.addEventListener('click', function () {
        auth.signOut().then(function () {
            window.location.replace('login.html');
        });
    });

    auth.onAuthStateChanged(function (user) {
        if (!user) {
            window.location.replace('login.html');
            return;
        }

        document.body.classList.remove('auth-checking');
        document.getElementById('admin-user').textContent = 'Sesión: ' + user.email;
        initAdminPanel();
    });

})();
