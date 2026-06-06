let loanChart = null;

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM Elements for performance and clarity
    const ui = {
        amount: document.getElementById('amount'),
        duration: document.getElementById('duration'),
        startDate: document.getElementById('startDate'),
        firstPaymentDate: document.getElementById('firstPaymentDate'),
        calculateBtn: document.getElementById('calculate-btn'),
        simulationName: document.getElementById('simulationName'),
        fees: document.getElementById('fees'),
        insuranceRate: document.getElementById('insurance-rate'),
        insuranceFixed: document.getElementById('insurance-fixed'),
        periodicity: document.getElementById('periodicity'),
        summary: document.getElementById('summary'),
        rateTiersContainer: document.getElementById('rate-tiers-container'),
        prepaymentsContainer: document.getElementById('prepayments-container'),
        downloadPdfBtn: document.getElementById('download-pdf-btn'),
        exportJsonBtn: document.getElementById('export-json-btn'),
        importJsonBtn: document.getElementById('import-json-btn'),
        importJsonInput: document.getElementById('import-json-input')
    };

    const button = ui.calculateBtn;
    const addTierBtn = document.getElementById('add-tier-btn');
    const tiersContainer = document.getElementById('rate-tiers-container');
    const addPrepaymentBtn = document.getElementById('add-prepayment-btn');
    const prepaymentsContainer = document.getElementById('prepayments-container');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const importJsonBtn = document.getElementById('import-json-btn');
    const importJsonInput = document.getElementById('import-json-input');

    // Set default dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    document.getElementById('startDate').value = todayStr;

    const firstPaymentDate = new Date(today);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 6); // 6 months after start date
    const firstPaymentDateStr = firstPaymentDate.toISOString().split('T')[0];
    document.getElementById('firstPaymentDate').value = firstPaymentDateStr;

    // Toggle affichage config assurance
    const rateConfig = document.getElementById('insurance-rate-config');
    const fixedConfig = document.getElementById('insurance-fixed-config');
    document.querySelectorAll('input[name="insurance-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            rateConfig.style.display = e.target.value === 'rate' ? 'block' : 'none';
            fixedConfig.style.display = e.target.value === 'fixed' ? 'block' : 'none';
        });
    });

    // --- Shared Logic for Data Handling ---
    const getSimulationData = () => {
        return {
            simulationName: ui.simulationName.value,
            amount: ui.amount.value,
            duration: ui.duration.value,
            startDate: ui.startDate.value,
            firstPaymentDate: ui.firstPaymentDate.value,
            fees: ui.fees.value,
            insuranceMethod: document.querySelector('input[name="insurance-method"]:checked').value,
            insuranceRate: ui.insuranceRate.value,
            insuranceFixed: ui.insuranceFixed.value,
            insuranceType: document.querySelector('input[name="insurance-type"]:checked').value,
            intercalaryStrategy: document.querySelector('input[name="intercalary-strategy"]:checked').value,
            periodicity: ui.periodicity.value,
            prepaymentStrategy: document.querySelector('input[name="prepayment-strategy"]:checked').value,
            tiers: Array.from(document.querySelectorAll('#rate-tiers-container .rate-tier')).map(row => ({
                rate: row.querySelector('.tier-rate').value,
                month: row.querySelector('.tier-month').value,
                balance: row.querySelector('.tier-manual-balance').value
            })),
            prepayments: Array.from(document.querySelectorAll('.prepayment-item')).map(row => ({
                amount: row.querySelector('.prepayment-amount').value,
                month: row.querySelector('.prepayment-month').value
            }))
        };
    };

    const applySimulationData = (data) => {
        if (!data) return;
        // Nettoyer les champs dynamiques existants
        const tiersRows = document.querySelectorAll('#rate-tiers-container .rate-tier');
        for (let i = 1; i < tiersRows.length; i++) tiersRows[i].remove();
        prepaymentsContainer.innerHTML = '';

        document.getElementById('simulationName').value = data.simulationName || "Ma Simulation";
        document.getElementById('amount').value = data.amount || 100000;
        document.getElementById('duration').value = data.duration || 120;
        document.getElementById('startDate').value = data.startDate || todayStr;
        document.getElementById('firstPaymentDate').value = data.firstPaymentDate || firstPaymentDateStr;
        document.getElementById('fees').value = data.fees || 500;
        document.getElementById('periodicity').value = data.periodicity || "1";
        document.getElementById('insurance-rate').value = data.insuranceRate || 0.36;
        document.getElementById('insurance-fixed').value = data.insuranceFixed || 30;
        if (data.insuranceMethod) {
            document.querySelector(`input[name="insurance-method"][value="${data.insuranceMethod}"]`).checked = true;
            rateConfig.style.display = data.insuranceMethod === 'rate' ? 'block' : 'none';
            fixedConfig.style.display = data.insuranceMethod === 'fixed' ? 'block' : 'none';
        }
        if (data.insuranceType) document.querySelector(`input[name="insurance-type"][value="${data.insuranceType}"]`).checked = true;
        if (data.intercalaryStrategy) document.querySelector(`input[name="intercalary-strategy"][value="${data.intercalaryStrategy}"]`).checked = true;
        if (data.prepaymentStrategy) document.querySelector(`input[name="prepayment-strategy"][value="${data.prepaymentStrategy}"]`).checked = true;

        if (data.tiers && data.tiers.length > 0) {
            const firstTier = document.querySelector('#rate-tiers-container .rate-tier');
            firstTier.querySelector('.tier-rate').value = data.tiers[0].rate;
            firstTier.querySelector('.tier-manual-balance').value = data.tiers[0].balance;
            for (let i = 1; i < data.tiers.length; i++) {
                addTierBtn.click();
                const rows = document.querySelectorAll('#rate-tiers-container .rate-tier');
                const last = rows[rows.length - 1];
                last.querySelector('.tier-rate').value = data.tiers[i].rate;
                last.querySelector('.tier-month').value = data.tiers[i].month;
                last.querySelector('.tier-manual-balance').value = data.tiers[i].balance;
            }
        }
        if (data.prepayments) {
            data.prepayments.forEach(p => {
                addPrepaymentBtn.click();
                const rows = document.querySelectorAll('.prepayment-item');
                const last = rows[rows.length - 1];
                last.querySelector('.prepayment-amount').value = p.amount;
                last.querySelector('.prepayment-month').value = p.month;
            });
        }
        button.click();
    };

    const saveToLocalStorage = () => {
        localStorage.setItem('loan_simulation_data', JSON.stringify(getSimulationData()));
    };

    const loadFromLocalStorage = () => {
        const saved = localStorage.getItem('loan_simulation_data');
        if (saved) applySimulationData(JSON.parse(saved));
    };

    // --- Import / Export JSON Logic ---
    exportJsonBtn.addEventListener('click', () => {
        const data = getSimulationData();
        const simName = data.simulationName || 'simulation';
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateString = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
        a.href = url;
        a.download = `${simName.replace(/\s+/g, '_')}_${dateString}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    importJsonBtn.addEventListener('click', () => importJsonInput.click());
    importJsonInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                applySimulationData(JSON.parse(event.target.result));
            } catch (err) { alert("Erreur lors de l'importation."); }
        };
        reader.readAsText(file);
    });

    addTierBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'rate-tier';
        div.innerHTML = `
            <input type="number" step="0.01" placeholder="Taux %" class="tier-rate">
            <input type="number" placeholder="Mois n°" class="tier-month">
            <input type="number" placeholder="Capital (€)" class="tier-manual-balance" style="font-size: 0.8rem; flex: 1;">
            <button type="button" onclick="this.parentElement.remove()" style="background: #ef4444; padding: 5px 10px;">X</button>
        `;
        tiersContainer.appendChild(div);
    });
    
    addPrepaymentBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'prepayment-item rate-tier';
        div.innerHTML = `
            <input type="number" placeholder="Montant €" class="prepayment-amount">
            <input type="number" placeholder="Au mois n°" class="prepayment-month">
            <button type="button" onclick="this.parentElement.remove()" style="background: #ef4444; padding: 5px 10px;">X</button>
        `;
        prepaymentsContainer.appendChild(div);
    });

    button.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('amount').value);
        const durationMonths = parseInt(document.getElementById('duration').value);
        const firstPaymentDateStr = document.getElementById('firstPaymentDate').value;
        const startDateStr = document.getElementById('startDate').value;
        const fees = parseFloat(document.getElementById('fees').value) || 0;
        const insuranceMethod = document.querySelector('input[name="insurance-method"]:checked').value;
        const annualInsuranceRate = parseFloat(document.getElementById('insurance-rate').value) / 100 || 0;
        const insuranceFixed = parseFloat(document.getElementById('insurance-fixed').value) || 0;
        const insuranceType = document.querySelector('input[name="insurance-type"]:checked').value;
        const intercalaryStrategy = document.querySelector('input[name="intercalary-strategy"]:checked').value;
        const prepaymentStrategy = document.querySelector('input[name="prepayment-strategy"]:checked').value;
        const periodicity = parseInt(document.getElementById('periodicity').value);


        // Correction : On cible uniquement les tranches de taux dans leur conteneur spécifique
        const tiers = Array.from(document.querySelectorAll('#rate-tiers-container .rate-tier')).map(row => ({
            rate: parseFloat(row.querySelector('.tier-rate').value) / 100,
            startMonth: parseInt(row.querySelector('.tier-month').value),
            manualBalance: parseFloat(row.querySelector('.tier-manual-balance').value) || 0
        })).sort((a, b) => a.startMonth - b.startMonth);

        // Récupération des remboursements anticipés
        const prepayments = Array.from(document.querySelectorAll('.prepayment-item')).map(row => ({
            amount: parseFloat(row.querySelector('.prepayment-amount').value) || 0,
            month: parseInt(row.querySelector('.prepayment-month').value) || 0
        }));

        if (!amount || isNaN(tiers[0].rate) || !durationMonths || !firstPaymentDateStr) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        generateTable(amount, tiers, durationMonths, new Date(firstPaymentDateStr), startDateStr, fees, annualInsuranceRate, insuranceFixed, insuranceMethod, insuranceType, prepayments, prepaymentStrategy, intercalaryStrategy, periodicity);
        downloadPdfBtn.style.display = 'block';
        saveToLocalStorage();
    });

    // Charger les données sauvegardées à l'initialisation
    loadFromLocalStorage();

    downloadPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const now = new Date();
        const dateString = now.toLocaleDateString('fr-FR').replace(/\//g, '-');

        // --- PDF Content Generation ---
        const amount = ui.amount.value;

        // 1. Title
        const simName = document.getElementById('simulationName').value || 'Simulation';
        doc.setFontSize(18);
        doc.setTextColor(59, 93, 246);
        doc.text("Échéancier de remboursement de prêt", 14, 22);
        doc.setFontSize(14);
        doc.text(`Nom : ${simName}`, 14, 30);
        
        // 2. Simulation Parameters
        const duration = document.getElementById('duration').value;
        const startDate = document.getElementById('startDate').value || 'Non spécifiée';
        const firstPaymentDate = document.getElementById('firstPaymentDate').value || 'Non spécifiée';
        const fees = document.getElementById('fees').value;
        const intercalaryStrategy = document.querySelector('input[name="intercalary-strategy"]:checked').value === 'pay' ? 'Payés' : 'Capitalisés';
        const insuranceMethod = document.querySelector('input[name="insurance-method"]:checked').value;
        let insuranceInfo = insuranceMethod === 'rate' 
            ? `${document.getElementById('insurance-rate').value}% (${document.querySelector('input[name="insurance-type"]:checked').value === 'initial' ? 'Initial' : 'Restant'})`
            : `${document.getElementById('insurance-fixed').value} € / échéance`;

        const prepaymentStrategy = document.querySelector('input[name="prepayment-strategy"]:checked').value === 'payment' ? 'Réduction mensualité' : 'Réduction durée';
        const periodicityText = document.getElementById('periodicity').options[document.getElementById('periodicity').selectedIndex].text;

        // Tiers summary
        const tiers = Array.from(document.querySelectorAll('#rate-tiers-container .rate-tier')).map(row => ({
            rate: parseFloat(row.querySelector('.tier-rate').value),
            startMonth: parseInt(row.querySelector('.tier-month').value),
            manualBalance: parseFloat(row.querySelector('.tier-manual-balance').value) || 0
        })).sort((a, b) => a.startMonth - b.startMonth);
        const tiersSummary = tiers.map(t => `${t.rate}% (Mois ${t.startMonth}${t.manualBalance > 0 ? `, Cap: ${t.manualBalance}€` : ''})`).join(' | ');

        // Prepayments summary
        const prepayments = Array.from(document.querySelectorAll('#prepayments-container .prepayment-item')).map(row => ({
            amount: parseFloat(row.querySelector('.prepayment-amount').value) || 0,
            month: parseInt(row.querySelector('.prepayment-month').value) || 0
        }));
        const prepaymentsSummary = prepayments.length > 0 ? prepayments.map(p => `${p.amount}€ (Mois ${p.month})`).join(', ') : 'Aucun';

        doc.setFontSize(10);
        doc.setTextColor(50);
        let yOffset = 40;
        doc.text("Paramètres de simulation :", 14, yOffset);
        yOffset += 7;
        doc.setFontSize(9);
        doc.text(`Montant du prêt : ${amount} €`, 14, yOffset); yOffset += 5;
        doc.text(`Durée : ${duration} mois`, 14, yOffset); yOffset += 5;
        doc.text(`Date de déblocage : ${startDate}`, 14, yOffset); yOffset += 5;
        doc.text(`Date 1er remboursement : ${firstPaymentDate}`, 14, yOffset); yOffset += 5;
        doc.text(`Taux d'intérêt : ${tiersSummary}`, 14, yOffset); yOffset += 5;
        doc.text(`Frais de dossier : ${fees} €`, 14, yOffset); yOffset += 5;
        doc.text(`Assurance : ${insuranceInfo}`, 14, yOffset); yOffset += 5;
        doc.text(`Périodicité : ${periodicityText}`, 14, yOffset); yOffset += 5;
        doc.text(`Gestion du différé : ${intercalaryStrategy}`, 14, yOffset); yOffset += 5;
        doc.text(`Remboursements anticipés : ${prepaymentsSummary}`, 14, yOffset); yOffset += 5;
        doc.text(`Stratégie RA : ${prepaymentStrategy}`, 14, yOffset); yOffset += 5;

        // --- Ajout du Graphique au PDF ---
        const chartCanvas = document.getElementById('loanChart');
        if (chartCanvas) {
            const chartImg = chartCanvas.toDataURL('image/png', 1.0);
            doc.addImage(chartImg, 'PNG', 15, yOffset, 180, 80);
            yOffset += 85; // On décale le reste du contenu vers le bas
        }

        // 3. Summary Results
        yOffset += 5; // Add a little space
        const summaryBox = document.querySelector('.summary-box');
        if (summaryBox) {
            doc.setFontSize(11);
            doc.setTextColor(0);
            const summaryLines = summaryBox.innerText.split('\n').filter(l => l.trim() !== "" && !l.includes("Déblocage"));
            doc.text(summaryLines, 14, yOffset);
            yOffset += (summaryLines.length * 5) + 10; // Estimate height of summary lines
        }

        // 4. Amortization Table
        doc.autoTable({
            html: '#amortizationTable',
            startY: yOffset, // Use calculated yOffset
            headStyles: { fillColor: [59, 93, 246] },
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 247, 255] }
        });

        doc.save(`${simName.replace(/\s+/g, '_')}_${dateString}.pdf`);
    });
});

function generateTable(principal, tiers, totalMonths, firstPaymentDate, startDateStr, fees, annualInsuranceRate, insuranceFixed, insuranceMethod, insuranceType, prepayments, prepaymentStrategy, intercalaryStrategy, periodicity) {
    const tbody = document.querySelector('#amortizationTable tbody');
    tbody.innerHTML = '';
    let remainingBalance = principal;
    let currentDate = new Date(firstPaymentDate);
    let currentMonthlyPayment = 0;
    let totalInterest = 0;
    let totalInsurance = 0;
    let actualMonths = 0;
    const chartDataActual = [principal];
    const chartLabels = ["Début"];
    
    // Stockage des soldes pour l'affichage dans les tranches
    const tierBalances = {};

    // --- Calcul des intérêts intercalaires (Différé) ---
    const releaseDate = new Date(startDateStr);
    const firstPayment = new Date(firstPaymentDate);
    // Le différé réel est l'écart en mois moins 1 (le premier mois de remboursement couvre le dernier mois d'intérêts)
    const diffMonths = (firstPayment.getFullYear() - releaseDate.getFullYear()) * 12 + (firstPayment.getMonth() - releaseDate.getMonth()) - 1;

    const isCapitalized = intercalaryStrategy === 'capitalize';

    if (diffMonths > 0 && !isNaN(releaseDate.getTime())) {
        const initialRate = tiers[0].rate / 12;
        const intercalaryInterest = principal * initialRate * diffMonths;
        const monthlyIns = (insuranceMethod === 'rate') 
            ? (principal * annualInsuranceRate / 12)
            : (insuranceFixed / periodicity);
        const totalDiffInsurance = monthlyIns * diffMonths;

        const intercalaryEndDate = new Date(firstPayment);
        intercalaryEndDate.setMonth(intercalaryEndDate.getMonth() - 1);
        
        totalInterest += intercalaryInterest;
        totalInsurance += totalDiffInsurance;

        // Ajouter une ligne informative pour le différé
        const row = tbody.insertRow();
        row.className = "intercalary-row";
        row.style.backgroundColor = "#fffbeb";
        row.insertCell(0).innerText = "Différé";
        row.insertCell(1).innerHTML = `${releaseDate.toLocaleDateString('fr-FR', {month:'short', year:'numeric'})}<br>${intercalaryEndDate.toLocaleDateString('fr-FR', {month:'short', year:'numeric'})}`;
        row.insertCell(2).innerText = (tiers[0].rate * 100).toFixed(2) + " %";
        
        // Mensualité pendant différé : Intérêts (si payés) + Assurance (toujours payée mensuellement)
        const paidDiff = isCapitalized ? totalDiffInsurance : (intercalaryInterest + totalDiffInsurance);
        row.insertCell(3).innerText = paidDiff.toFixed(2) + " €";
        row.insertCell(4).innerText = intercalaryInterest.toFixed(2) + " €";
        row.insertCell(5).innerText = totalDiffInsurance.toFixed(2) + " €";
        row.insertCell(6).innerText = "0.00 €";
        row.insertCell(7).innerText = "-";
        row.insertCell(8).innerText = principal.toFixed(2) + " €";

        if (isCapitalized) {
            remainingBalance += intercalaryInterest;
        }

        // Ajouter les points correspondants au graphique pour le plateau du différé
        let diffDate = new Date(releaseDate);
        for (let d = 0; d < diffMonths; d++) {
            diffDate.setMonth(diffDate.getMonth() + 1);
            const currentBal = isCapitalized ? principal + (principal * initialRate * (d + 1)) : principal;
            chartDataActual.push(currentBal);
            chartLabels.push(diffDate.toLocaleDateString('fr-FR', {month:'short', year:'numeric'}));
        }
    }

    const numPeriods = Math.floor(totalMonths / periodicity);
    for (let p = 1; p <= numPeriods; p++) {
        if (remainingBalance <= 0.01) break;
        actualMonths += periodicity;
        const currentMonth = p * periodicity;

        // Vérifier s'il y a un changement de taux ce mois-ci
        const activeTier = [...tiers].reverse().find(t => t.startMonth <= currentMonth) || tiers[0];
        const periodRate = (activeTier.rate / 12) * periodicity;

        // Recalcul de la mensualité si le taux change, si un capital est forcé ou au premier mois
        const isFirstPeriod = (p === 1);
        const tierChanged = tiers.find(t => t.startMonth > (p - 1) * periodicity && t.startMonth <= p * periodicity);
        
        if (isFirstPeriod || tierChanged) {
            const tierStartingNow = tiers.find(t => t.startMonth === currentMonth);
            // Si un capital est saisi manuellement pour cette tranche, on remplace le solde calculé
            if (tierStartingNow && tierStartingNow.manualBalance > 0) {
                remainingBalance = tierStartingNow.manualBalance;
            }
            tierBalances[currentMonth] = remainingBalance;
            const remainingPeriods = numPeriods - p + 1;
            if (periodRate === 0) {
                currentMonthlyPayment = remainingBalance / remainingPeriods;
            } else {
                currentMonthlyPayment = remainingBalance * (periodRate / (1 - Math.pow(1 + periodRate, -remainingPeriods)));
            }
        }

        const interestPayment = Math.max(0, remainingBalance * periodRate);
        const monthlyInsurance = (insuranceMethod === 'rate')
            ? (insuranceType === 'initial' ? principal : remainingBalance) * (annualInsuranceRate / 12) * periodicity
            : insuranceFixed;
            
        const principalPayment = Math.min(remainingBalance, Math.max(0, currentMonthlyPayment - interestPayment));

        // Gestion des remboursements anticipés cumulés sur la période
        let prepaymentAmount = 0;
        prepayments.forEach(prep => {
            if (prep.month > (p - 1) * periodicity && prep.month <= p * periodicity) {
                prepaymentAmount += Math.min(remainingBalance - principalPayment - prepaymentAmount, prep.amount);
            }
        });
        
        const totalMonthlyPayment = principalPayment + interestPayment + monthlyInsurance;
        remainingBalance -= (principalPayment + prepaymentAmount);
        
        totalInterest += interestPayment;
        totalInsurance += monthlyInsurance;

        // Recalcul de la mensualité uniquement si stratégie "Réduire la mensualité"
        if (prepaymentStrategy === 'payment' && prepaymentAmount > 0 && remainingBalance > 0 && p < numPeriods) {
            const remainingPeriods = numPeriods - p;
            const nextTier = [...tiers].reverse().find(t => t.startMonth <= (p * periodicity) + 1) || tiers[0];
            const nextPeriodRate = (nextTier.rate / 12) * periodicity;
            
            if (nextPeriodRate > 0) {
                currentMonthlyPayment = remainingBalance * (nextPeriodRate / (1 - Math.pow(1 + nextPeriodRate, -remainingPeriods)));
            } else {
                currentMonthlyPayment = remainingBalance / remainingPeriods;
            }
        }

        const row = tbody.insertRow();
        row.insertCell(0).innerText = p;
        row.insertCell(1).innerText = currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        row.insertCell(2).innerText = (activeTier.rate * 100).toFixed(2) + " %";
        row.insertCell(3).innerText = (totalMonthlyPayment > 0 ? totalMonthlyPayment.toFixed(2) : "0.00") + " €";
        row.insertCell(4).innerText = interestPayment.toFixed(2) + " €";
        row.insertCell(5).innerText = monthlyInsurance.toFixed(2) + " €";
        row.insertCell(6).innerText = principalPayment.toFixed(2) + " €";
        row.insertCell(7).innerText = prepaymentAmount > 0 ? prepaymentAmount.toFixed(2) + " €" : "-";
        row.insertCell(8).innerText = Math.max(0, remainingBalance).toFixed(2) + " €";

        for (let k = 0; k < periodicity; k++) {
            chartDataActual.push(Math.max(0, remainingBalance));
            chartLabels.push(currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
        }

        currentDate.setMonth(currentDate.getMonth() + periodicity);
    }

    // --- Affichage du récapitulatif des paramètres sous le graphique ---
    const parametersSection = document.getElementById('parameters-display');
    const parametersContent = document.getElementById('parameters-content');
    parametersSection.style.display = 'block';

    const simNameDisplay = document.getElementById('simulationName').value || 'N/A';
    const insuranceMethodVal = document.querySelector('input[name="insurance-method"]:checked').value;
    const insuranceText = insuranceMethodVal === 'rate' 
        ? `${document.getElementById('insurance-rate').value}% (${document.querySelector('input[name="insurance-type"]:checked').value === 'initial' ? 'Sur cap. initial' : 'Sur cap. restant'})`
        : `${document.getElementById('insurance-fixed').value} € / échéance`;

    const intercalaryText = intercalaryStrategy === 'pay' ? 'Intérêts payés' : 'Intérêts capitalisés';
    const strategyRAText = prepaymentStrategy === 'payment' ? 'Réduction mensualité' : 'Réduction durée';
    const periodicityText = document.getElementById('periodicity').options[document.getElementById('periodicity').selectedIndex].text;
    const tiersTxt = tiers.map(t => `${(t.rate*100).toFixed(2)}% (Mois ${t.startMonth}${t.manualBalance > 0 ? `, Cap: ${t.manualBalance}€` : ''})`).join(' | ');
    const prepaymentsTxt = prepayments.length > 0 ? prepayments.map(p => `${p.amount}€ (Mois ${p.month})`).join(', ') : 'Aucun';

    parametersContent.innerHTML = `
        <div style="grid-column: span 2;"><strong>Nom de la simulation :</strong> ${simNameDisplay}</div>
        <div><strong>Montant :</strong> ${principal.toLocaleString()} €</div>
        <div><strong>Durée :</strong> ${totalMonths} mois</div>
        <div><strong>Déblocage :</strong> ${startDateStr || 'N/A'}</div>
        <div><strong>1er Remboursement :</strong> ${firstPaymentDate.toLocaleDateString('fr-FR')}</div>
        <div><strong>Périodicité :</strong> ${periodicityText}</div>
        <div><strong>Gestion différé :</strong> ${intercalaryText}</div>
        <div><strong>Assurance :</strong> ${insuranceText}</div>
        <div><strong>Frais dossier :</strong> ${fees} €</div>
        <div style="grid-column: span 2; border-top: 1px solid #eee; padding-top: 10px;"><strong>Taux :</strong> ${tiersTxt}</div>
        <div style="grid-column: span 2;"><strong>Remb. Anticipés :</strong> ${prepaymentsTxt} (Stratégie : ${strategyRAText})</div>
    `;

    // Mise à jour de l'affichage du capital restant dans les tranches de taux
    document.querySelectorAll('#rate-tiers-container .rate-tier').forEach(row => {
        const m = parseInt(row.querySelector('.tier-month').value);
        const input = row.querySelector('.tier-manual-balance');
        if (input && !input.value) { // On ne remplit que si l'utilisateur n'a rien saisi
            const bal = tierBalances[m];
            // Optionnel : On peut afficher le solde calculé en placeholder
            if (bal !== undefined) input.placeholder = `Est: ${bal.toFixed(0)} €`;
        }
    });
    
    // Calcul du scénario de base (sans remboursement) pour le graphique
    const chartDataBaseline = calculateBaseline(principal, tiers, totalMonths, Math.max(0, diffMonths), isCapitalized, periodicity);

    // Mise à jour du résumé après calcul total
    const totalCost = totalInterest + totalInsurance + fees;
    document.getElementById('summary').innerHTML = `
        <div class="summary-box">
            <p>Déblocage des fonds : <strong>${startDateStr ? new Date(startDateStr).toLocaleDateString('fr-FR') : 'Non précisée'}</strong></p>
            <p>Durée réelle : <strong>${actualMonths} mois</strong></p>
            <p>Intérêts : ${totalInterest.toFixed(2)} € | Assurance : ${totalInsurance.toFixed(2)} €</p>
            <p>Frais de dossier : ${fees.toFixed(2)} €</p>
            <hr>
            <h3>Coût total du crédit : ${totalCost.toFixed(2)} €</h3>
            <p>Total remboursé : ${(principal + totalCost).toFixed(2)} €</p>
        </div>
    `;

    updateChart(chartLabels, chartDataActual, chartDataBaseline);
}

function calculateBaseline(principal, tiers, totalMonths, diffMonths, isCapitalized, periodicity) {
    let balances = [principal];
    let remaining = principal;
    let currentPeriodPayment = 0;
    const initialRate = tiers[0].rate / 12;
    const numPeriods = Math.floor(totalMonths / periodicity);

    // On ajoute les points pour le différé
    for (let d = 0; d < diffMonths; d++) {
        if (isCapitalized) {
            remaining += (principal * initialRate);
        }
        balances.push(remaining);
    }

    for (let p = 1; p <= numPeriods; p++) {
        const currentMonth = p * periodicity;
        const activeTier = [...tiers].reverse().find(t => t.startMonth <= currentMonth) || tiers[0];
        const periodRate = (activeTier.rate / 12) * periodicity;

        if (p === 1 || tiers.find(t => t.startMonth > (p - 1) * periodicity && t.startMonth <= p * periodicity)) {
            const remainingPeriods = numPeriods - p + 1;
            currentPeriodPayment = (periodRate === 0) 
                ? remaining / remainingPeriods 
                : remaining * (periodRate / (1 - Math.pow(1 + periodRate, -remainingPeriods)));
        }

        const interest = remaining * periodRate;
        const principalPaid = Math.min(remaining, currentPeriodPayment - interest);
        remaining -= principalPaid;
        for (let k = 0; k < periodicity; k++) {
            balances.push(Math.max(0, remaining));
        }
    }
    return balances;
}

function updateChart(labels, actual, baseline) {
    const ctx = document.getElementById('loanChart').getContext('2d');
    
    if (loanChart) {
        loanChart.destroy();
    }

    loanChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Avec remboursements',
                    data: actual,
                    borderColor: '#3b5df6',
                    backgroundColor: 'rgba(59, 93, 246, 0.1)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Scénario initial',
                    data: baseline,
                    borderColor: '#94a3b8',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Évolution du capital restant dû' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Capital (€)' }
                },
                x: {
                    ticks: {
                        callback: function(val, index) {
                            // N'afficher qu'un label sur 12 pour plus de clarté
                            return index % 12 === 0 ? this.getLabelForValue(val) : '';
                        }
                    }
                }
            }
        }
    });
}