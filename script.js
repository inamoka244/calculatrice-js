/**
 * ============================================
 * CALCULATRICE JS - LOGIQUE JAVASCRIPT
 * Mini-Projet MIAGE 2025-2026
 * ============================================
 * 
 * Ce fichier contient toute la logique de la calculatrice :
 * - Gestion de l'expression mathématique
 * - Calcul du résultat
 * - Historique avec localStorage
 */

// ============================================
// VARIABLES GLOBALES
// ============================================

/**
 * Expression mathématique en cours de saisie
 * @type {string}
 */
let currentExpression = '';

/**
 * Compteur de parenthèses ouvertes pour gérer l'alternance ()
 * @type {number}
 */
let openParentheses = 0;

/**
 * Clé utilisée pour stocker l'historique dans localStorage
 * @type {string}
 */
const HISTORY_KEY = 'calculatrice_historique';

/**
 * Nombre maximum d'opérations à conserver dans l'historique
 * @type {number}
 */
const MAX_HISTORY = 3;


// ============================================
// FONCTIONS D'AFFICHAGE
// ============================================

/**
 * Met à jour l'affichage de l'expression et du résultat
 * Cette fonction est appelée après chaque modification de l'expression
 */
function updateDisplay() {
    const expressionElement = document.getElementById('expression');
    const resultElement = document.getElementById('result');
    
    // Afficher l'expression en cours
    expressionElement.textContent = currentExpression;
    
    // Si l'expression est vide, afficher 0
    if (currentExpression === '') {
        resultElement.textContent = '0';
    }
}

/**
 * Affiche l'historique des opérations depuis localStorage
 * Récupère les données et génère le HTML correspondant
 */
function displayHistory() {
    const historyList = document.getElementById('historyList');
    const history = getHistory();
    
    // Si l'historique est vide, afficher un message
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">Aucune opération</p>';
        return;
    }
    
    // Générer le HTML pour chaque élément de l'historique
    let html = '';
    history.forEach(item => {
        html += `
            <div class="history-item">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">${item.result}</div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}


// ============================================
// FONCTIONS DE GESTION DE L'EXPRESSION
// ============================================

/**
 * Ajoute un caractère ou une valeur à l'expression
 * Gère les cas spéciaux comme les parenthèses et les opérateurs
 * 
 * @param {string} value - La valeur à ajouter (chiffre, opérateur, etc.)
 */
function appendToExpression(value) {
    // Gestion spéciale des parenthèses
    if (value === '()') {
        handleParentheses();
        return;
    }
    
    // Gestion du pourcentage
    if (value === '%') {
        if (currentExpression !== '' && !isOperator(currentExpression.slice(-1))) {
            currentExpression += '%';
        }
        updateDisplay();
        return;
    }
    
    // Empêcher plusieurs opérateurs consécutifs
    if (isOperator(value) && isOperator(currentExpression.slice(-1))) {
        // Remplacer le dernier opérateur
        currentExpression = currentExpression.slice(0, -1) + value;
        updateDisplay();
        return;
    }
    
    // Empêcher de commencer par un opérateur (sauf le moins pour les nombres négatifs)
    if (currentExpression === '' && isOperator(value) && value !== '-') {
        return;
    }
    
    // Empêcher plusieurs points décimaux dans un même nombre
    if (value === '.') {
        const lastNumber = getLastNumber();
        if (lastNumber.includes('.')) {
            return;
        }
    }
    
    // Ajouter la valeur à l'expression
    currentExpression += value;
    updateDisplay();
}

/**
 * Gère l'ajout de parenthèses de manière intelligente
 * Alterne entre parenthèse ouvrante et fermante selon le contexte
 */
function handleParentheses() {
    const lastChar = currentExpression.slice(-1);
    
    // Conditions pour ajouter une parenthèse ouvrante
    if (currentExpression === '' || 
        lastChar === '(' || 
        isOperator(lastChar)) {
        currentExpression += '(';
        openParentheses++;
    } 
    // Conditions pour ajouter une parenthèse fermante
    else if (openParentheses > 0 && 
             !isOperator(lastChar) && 
             lastChar !== '(') {
        currentExpression += ')';
        openParentheses--;
    } 
    // Par défaut, ajouter une parenthèse ouvrante
    else {
        currentExpression += '(';
        openParentheses++;
    }
    
    updateDisplay();
}

/**
 * Supprime le dernier caractère de l'expression (backspace)
 * Met à jour le compteur de parenthèses si nécessaire
 */
function backspace() {
    if (currentExpression.length > 0) {
        const lastChar = currentExpression.slice(-1);
        
        // Mettre à jour le compteur de parenthèses
        if (lastChar === '(') {
            openParentheses--;
        } else if (lastChar === ')') {
            openParentheses++;
        }
        
        // Supprimer le dernier caractère
        currentExpression = currentExpression.slice(0, -1);
        updateDisplay();
    }
}

/**
 * Réinitialise complètement la calculatrice
 * Efface l'expression et remet le compteur de parenthèses à zéro
 */
function clearAll() {
    currentExpression = '';
    openParentheses = 0;
    updateDisplay();
}


// ============================================
// FONCTIONS DE CALCUL
// ============================================

/**
 * Calcule le résultat de l'expression mathématique
 * Convertit les symboles visuels en opérateurs JavaScript
 * Gère les erreurs et sauvegarde dans l'historique
 */
function calculate() {
    if (currentExpression === '') {
        return;
    }
    
    try {
        // Convertir l'expression pour JavaScript
        let expression = currentExpression
            .replace(/×/g, '*')      // Multiplication
            .replace(/÷/g, '/')      // Division
            .replace(/%/g, '/100');  // Pourcentage
        
        // Fermer les parenthèses non fermées
        while (openParentheses > 0) {
            expression += ')';
            openParentheses--;
        }
        
        // Évaluer l'expression de manière sécurisée
        const result = evaluateExpression(expression);
        
        // Vérifier si le résultat est valide
        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Résultat invalide');
        }
        
        // Formater le résultat
        const formattedResult = formatResult(result);
        
        // Sauvegarder dans l'historique
        saveToHistory(currentExpression, formattedResult);
        
        // Afficher le résultat
        document.getElementById('result').textContent = formattedResult;
        
        // L'expression devient le résultat pour continuer les calculs
        currentExpression = formattedResult;
        document.getElementById('expression').textContent = '';
        
        // Mettre à jour l'affichage de l'historique
        displayHistory();
        
    } catch (error) {
        // En cas d'erreur, afficher "Erreur"
        document.getElementById('result').textContent = 'Erreur';
        currentExpression = '';
        openParentheses = 0;
    }
}

/**
 * Évalue une expression mathématique de manière sécurisée
 * Utilise Function() au lieu de eval() pour plus de sécurité
 * 
 * @param {string} expression - L'expression à évaluer
 * @returns {number} Le résultat du calcul
 */
function evaluateExpression(expression) {
    // Vérifier que l'expression ne contient que des caractères autorisés
    const validChars = /^[\d+\-*/().%\s]+$/;
    if (!validChars.test(expression)) {
        throw new Error('Expression invalide');
    }
    
    // Évaluer l'expression
    return Function('"use strict"; return (' + expression + ')')();
}

/**
 * Formate le résultat pour un affichage propre
 * Limite le nombre de décimales et gère les grands nombres
 * 
 * @param {number} result - Le résultat à formater
 * @returns {string} Le résultat formaté
 */
function formatResult(result) {
    // Si c'est un entier, le retourner tel quel
    if (Number.isInteger(result)) {
        return result.toString();
    }
    
    // Limiter à 10 décimales et supprimer les zéros inutiles
    let formatted = result.toFixed(10);
    formatted = parseFloat(formatted).toString();
    
    // Si le nombre est trop long, utiliser la notation scientifique
    if (formatted.length > 12) {
        return result.toExponential(6);
    }
    
    return formatted;
}


// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Vérifie si un caractère est un opérateur mathématique
 * 
 * @param {string} char - Le caractère à vérifier
 * @returns {boolean} True si c'est un opérateur
 */
function isOperator(char) {
    return ['+', '-', '×', '÷', '*', '/'].includes(char);
}

/**
 * Récupère le dernier nombre de l'expression
 * Utilisé pour vérifier les points décimaux
 * 
 * @returns {string} Le dernier nombre de l'expression
 */
function getLastNumber() {
    // Diviser par les opérateurs et parenthèses
    const parts = currentExpression.split(/[+\-×÷*/()]/);
    return parts[parts.length - 1] || '';
}


// ============================================
// FONCTIONS DE GESTION DE L'HISTORIQUE
// ============================================

/**
 * Récupère l'historique depuis localStorage
 * 
 * @returns {Array} Tableau des opérations précédentes
 */
function getHistory() {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (historyJson) {
        try {
            return JSON.parse(historyJson);
        } catch (e) {
            return [];
        }
    }
    return [];
}

/**
 * Sauvegarde une opération dans l'historique
 * Conserve uniquement les 3 dernières opérations
 * 
 * @param {string} expression - L'expression calculée
 * @param {string} result - Le résultat obtenu
 */
function saveToHistory(expression, result) {
    let history = getHistory();
    
    // Ajouter la nouvelle opération au début
    history.unshift({
        expression: expression,
        result: result,
        timestamp: new Date().toISOString()
    });
    
    // Garder seulement les 3 dernières opérations
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Efface tout l'historique
 * Peut être utilisé pour un bouton "Effacer l'historique"
 */
function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    displayHistory();
}


// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise la calculatrice au chargement de la page
 * Affiche l'historique existant
 */
document.addEventListener('DOMContentLoaded', function() {
    updateDisplay();
    displayHistory();
});

/**
 * Gestion des entrées clavier
 * Permet d'utiliser la calculatrice avec le clavier
 */
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    // Chiffres
    if (/^[0-9]$/.test(key)) {
        appendToExpression(key);
    }
    // Opérateurs
    else if (key === '+') {
        appendToExpression('+');
    }
    else if (key === '-') {
        appendToExpression('-');
    }
    else if (key === '*') {
        appendToExpression('×');
    }
    else if (key === '/') {
        event.preventDefault(); // Empêcher la recherche rapide Firefox
        appendToExpression('÷');
    }
    // Point décimal
    else if (key === '.' || key === ',') {
        appendToExpression('.');
    }
    // Parenthèses
    else if (key === '(' || key === ')') {
        appendToExpression('()');
    }
    // Égal / Entrée
    else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    }
    // Backspace
    else if (key === 'Backspace') {
        backspace();
    }
    // Escape / Clear
    else if (key === 'Escape') {
        clearAll();
    }
    // Pourcentage
    else if (key === '%') {
        appendToExpression('%');
    }
});
