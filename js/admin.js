// Administração CES Las Vegas 2026
// Sistema de gerenciamento de leads e inscrições

let currentPage = 1;
let totalPages = 1;
let leadsData = [];
let filteredData = [];
let conversionChart = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel iniciado');
    initializeAdmin();
});

async function initializeAdmin() {
    await loadLeadsData();
    updateDashboard();
    setupFilters();
    initializeChart();
    updateLastUpdateTime();
}

// Carregar dados dos leads
async function loadLeadsData() {
    try {
        const response = await fetch('tables/registrations?limit=1000&sort=created_at');
        if (response.ok) {
            const data = await response.json();
            leadsData = data.data || [];
            filteredData = [...leadsData];
            renderLeadsTable();
        } else {
            console.error('Erro ao carregar leads');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// Atualizar dashboard
function updateDashboard() {
    const totalLeads = leadsData.length;
    const qualifiedLeads = leadsData.filter(lead => ['qualified', 'registered', 'paid'].includes(lead.status)).length;
    const paidRegistrations = leadsData.filter(lead => lead.status === 'paid').length;
    const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : 0;
    
    document.getElementById('total-leads').textContent = totalLeads;
    document.getElementById('qualified-leads').textContent = qualifiedLeads;
    document.getElementById('paid-registrations').textContent = paidRegistrations;
    document.getElementById('conversion-rate').textContent = conversionRate + '%';
    
    updateConversionChart();
}

// Inicializar gráfico de conversão
function initializeChart() {
    const ctx = document.getElementById('conversionChart').getContext('2d');
    
    conversionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Lead', 'Contatado', 'Qualificado', 'Registrado', 'Pago', 'Cancelado'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    '#3B82F6',
                    '#EAB308', 
                    '#10B981',
                    '#8B5CF6',
                    '#059669',
                    '#EF4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Atualizar gráfico de conversão
function updateConversionChart() {
    const statusCounts = {
        lead: 0,
        contacted: 0,
        qualified: 0,
        registered: 0,
        paid: 0,
        cancelled: 0
    };
    
    leadsData.forEach(lead => {
        if (statusCounts.hasOwnProperty(lead.status)) {
            statusCounts[lead.status]++;
        }
    });
    
    if (conversionChart) {
        conversionChart.data.datasets[0].data = [
            statusCounts.lead,
            statusCounts.contacted,
            statusCounts.qualified,
            statusCounts.registered,
            statusCounts.paid,
            statusCounts.cancelled
        ];
        conversionChart.update();
    }
}

// Renderizar tabela de leads
function renderLeadsTable() {
    const tbody = document.getElementById('leads-table-body');
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>Nenhum lead encontrado</p>
                </td>
            </tr>
        `;
        return;
    }
    
    pageData.forEach(lead => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const createdDate = new Date(lead.created_at || lead.timestamp).toLocaleDateString('pt-BR');
        const statusClass = `status-${lead.status}`;
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            ${(lead.name || 'N').charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${lead.name || 'Nome não informado'}</div>
                        <div class="text-sm text-gray-500">${lead.position || 'Cargo não informado'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${lead.email || 'Email não informado'}</div>
                <div class="text-sm text-gray-500">${lead.phone || 'Telefone não informado'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${lead.company || 'Empresa não informada'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                    ${getStatusText(lead.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${createdDate}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="editLead('${lead.id}')" class="text-blue-600 hover:text-blue-900">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="contactLead('${lead.id}')" class="text-green-600 hover:text-green-900">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button onclick="deleteLead('${lead.id}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    updatePagination();
}

// Configurar filtros
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    
    searchInput.addEventListener('input', debounce(filterLeads, 300));
    statusFilter.addEventListener('change', filterLeads);
}

// Filtrar leads
function filterLeads() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    filteredData = leadsData.filter(lead => {
        const matchesSearch = !searchTerm || 
            (lead.name && lead.name.toLowerCase().includes(searchTerm)) ||
            (lead.email && lead.email.toLowerCase().includes(searchTerm)) ||
            (lead.company && lead.company.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || lead.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    currentPage = 1;
    renderLeadsTable();
}

// Paginação
function updatePagination() {
    totalPages = Math.ceil(filteredData.length / 10);
    
    document.getElementById('showing-from').textContent = 
        filteredData.length > 0 ? (currentPage - 1) * 10 + 1 : 0;
    document.getElementById('showing-to').textContent = 
        Math.min(currentPage * 10, filteredData.length);
    document.getElementById('total-records').textContent = filteredData.length;
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;
    
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderLeadsTable();
    }
}

// Editar lead
function editLead(leadId) {
    const lead = leadsData.find(l => l.id === leadId);
    if (!lead) return;
    
    document.getElementById('edit-id').value = lead.id;
    document.getElementById('edit-status').value = lead.status || 'lead';
    document.getElementById('edit-notes').value = lead.notes || '';
    
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

// Salvar edições do lead
document.getElementById('edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const leadId = document.getElementById('edit-id').value;
    const status = document.getElementById('edit-status').value;
    const notes = document.getElementById('edit-notes').value;
    
    try {
        const response = await fetch(`tables/registrations/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status,
                notes: notes
            })
        });
        
        if (response.ok) {
            await loadLeadsData();
            updateDashboard();
            closeEditModal();
            showNotification('Lead atualizado com sucesso!', 'success');
        } else {
            throw new Error('Erro ao atualizar lead');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao atualizar lead', 'error');
    }
});

// Contatar lead via WhatsApp
function contactLead(leadId) {
    const lead = leadsData.find(l => l.id === leadId);
    if (!lead) return;
    
    const message = encodeURIComponent(
        `Olá ${lead.name}! Vi que você se inscreveu para a imersão CES Las Vegas 2026 com Tony Ventura. Gostaria de conversar sobre os próximos passos e detalhes do evento. Como posso ajudá-lo?`
    );
    
    const phone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
    const whatsappUrl = phone ? 
        `https://wa.me/55${phone}?text=${message}` : 
        `https://wa.me/?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Marcar como contatado se ainda for lead
    if (lead.status === 'lead') {
        updateLeadStatus(leadId, 'contacted');
    }
}

// Atualizar status do lead
async function updateLeadStatus(leadId, newStatus) {
    try {
        const response = await fetch(`tables/registrations/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });
        
        if (response.ok) {
            await loadLeadsData();
            updateDashboard();
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
    }
}

// Deletar lead
async function deleteLead(leadId) {
    if (!confirm('Tem certeza que deseja deletar este lead?')) {
        return;
    }
    
    try {
        const response = await fetch(`tables/registrations/${leadId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadLeadsData();
            updateDashboard();
            showNotification('Lead deletado com sucesso!', 'success');
        } else {
            throw new Error('Erro ao deletar lead');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao deletar lead', 'error');
    }
}

// Exportar leads para CSV
function exportLeads() {
    if (filteredData.length === 0) {
        showNotification('Nenhum lead para exportar', 'warning');
        return;
    }
    
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cargo', 'Status', 'Data de Inscrição', 'Observações'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(lead => [
            `"${lead.name || ''}"`,
            `"${lead.email || ''}"`,
            `"${lead.phone || ''}"`,
            `"${lead.company || ''}"`,
            `"${lead.position || ''}"`,
            `"${getStatusText(lead.status)}"`,
            `"${new Date(lead.created_at || lead.timestamp).toLocaleDateString('pt-BR')}"`,
            `"${(lead.notes || '').replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ces-leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Atualizar dados
async function refreshData() {
    const button = event.target.closest('button');
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Atualizando...';
    button.disabled = true;
    
    await loadLeadsData();
    updateDashboard();
    updateLastUpdateTime();
    
    setTimeout(() => {
        button.innerHTML = originalHtml;
        button.disabled = false;
        showNotification('Dados atualizados com sucesso!', 'success');
    }, 1000);
}

// Utilitários
function getStatusText(status) {
    const statusMap = {
        lead: 'Lead',
        contacted: 'Contatado',
        qualified: 'Qualificado', 
        registered: 'Registrado',
        paid: 'Pago',
        cancelled: 'Cancelado'
    };
    return statusMap[status] || 'Desconhecido';
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    document.getElementById('last-update').querySelector('span').textContent = 
        `Última atualização: ${timeString}`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${
                type === 'success' ? 'check' : 
                type === 'error' ? 'exclamation-triangle' : 
                type === 'warning' ? 'exclamation' : 'info'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}