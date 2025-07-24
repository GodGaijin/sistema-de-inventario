#!/usr/bin/env node

/**
 * Script de Análisis de Seguridad
 * Detecta comportamientos sospechosos, IPs problemáticas y patrones de ataque
 * 
 * Uso:
 * node securityAnalysis.js [opciones]
 * 
 * Opciones:
 * --hours=24     Analizar las últimas N horas (default: 24)
 * --risk=0.5     Umbral de riesgo mínimo (default: 0.5)
 * --export       Exportar resultados a CSV
 * --block        Bloquear IPs sospechosas automáticamente
 */

require('dotenv').config({ path: './config.env' });
const db = require('../models/database');
const securityModel = require('../models/securityModel');
const fs = require('fs');
const path = require('path');

class SecurityAnalyzer {
  constructor() {
    this.hours = 24;
    this.riskThreshold = 0.5;
    this.exportResults = false;
    this.autoBlock = false;
    this.results = {
      suspiciousIPs: [],
      highRiskEvents: [],
      failedLogins: [],
      registrationAttempts: [],
      blockedIPs: [],
      recommendations: []
    };
  }

  parseArguments() {
    const args = process.argv.slice(2);
    
    args.forEach(arg => {
      if (arg.startsWith('--hours=')) {
        this.hours = parseInt(arg.split('=')[1]);
      } else if (arg.startsWith('--risk=')) {
        this.riskThreshold = parseFloat(arg.split('=')[1]);
      } else if (arg === '--export') {
        this.exportResults = true;
      } else if (arg === '--block') {
        this.autoBlock = true;
      }
    });
  }

  async analyzeSuspiciousIPs() {
    console.log(`🔍 Analizando IPs sospechosas en las últimas ${this.hours} horas...`);
    
    const query = `
      SELECT 
        ip_address,
        COUNT(*) as event_count,
        AVG(risk_score) as avg_risk_score,
        MAX(risk_score) as max_risk_score,
        COUNT(CASE WHEN action = 'login_failed' THEN 1 END) as failed_logins,
        COUNT(CASE WHEN action = 'registration' THEN 1 END) as registrations,
        COUNT(CASE WHEN action = 'login_success' THEN 1 END) as successful_logins,
        array_agg(DISTINCT action) as actions,
        MAX(timestamp) as last_activity,
        MIN(timestamp) as first_activity
      FROM security_audit_log 
      WHERE timestamp > NOW() - INTERVAL '${this.hours} hours'
      GROUP BY ip_address
      HAVING AVG(risk_score) > $1 OR COUNT(*) > 10
      ORDER BY avg_risk_score DESC, event_count DESC
    `;

    const result = await db.query(query, [this.riskThreshold]);
    this.results.suspiciousIPs = result.rows || result;
    
    console.log(`✅ Encontradas ${this.results.suspiciousIPs.length} IPs sospechosas`);
  }

  async analyzeHighRiskEvents() {
    console.log(`🚨 Analizando eventos de alto riesgo...`);
    
    const query = `
      SELECT 
        id,
        user_id,
        username,
        ip_address,
        action,
        risk_score,
        details,
        location_data,
        timestamp
      FROM security_audit_log 
      WHERE timestamp > NOW() - INTERVAL '${this.hours} hours'
        AND risk_score > $1
      ORDER BY risk_score DESC, timestamp DESC
    `;

    const result = await db.query(query, [this.riskThreshold]);
    this.results.highRiskEvents = result.rows || result;
    
    console.log(`✅ Encontrados ${this.results.highRiskEvents.length} eventos de alto riesgo`);
  }

  async analyzeFailedLogins() {
    console.log(`🔐 Analizando intentos fallidos de login...`);
    
    const query = `
      SELECT 
        ip_address,
        username,
        COUNT(*) as failed_attempts,
        MAX(timestamp) as last_attempt,
        MIN(timestamp) as first_attempt,
        AVG(risk_score) as avg_risk_score
      FROM security_audit_log 
      WHERE timestamp > NOW() - INTERVAL '${this.hours} hours'
        AND action = 'login_failed'
      GROUP BY ip_address, username
      HAVING COUNT(*) >= 3
      ORDER BY failed_attempts DESC
    `;

    const result = await db.query(query);
    this.results.failedLogins = result.rows || result;
    
    console.log(`✅ Encontrados ${this.results.failedLogins.length} patrones de intentos fallidos`);
  }

  async analyzeRegistrationAttempts() {
    console.log(`📝 Analizando intentos de registro...`);
    
    const query = `
      SELECT 
        ip_address,
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN success = true THEN 1 END) as successful,
        COUNT(CASE WHEN success = false THEN 1 END) as failed,
        MAX(timestamp) as last_attempt,
        MIN(timestamp) as first_attempt
      FROM registration_attempts 
      WHERE timestamp > NOW() - INTERVAL '${this.hours} hours'
      GROUP BY ip_address
      HAVING COUNT(*) > 2
      ORDER BY total_attempts DESC
    `;

    const result = await db.query(query);
    this.results.registrationAttempts = result.rows || result;
    
    console.log(`✅ Encontrados ${this.results.registrationAttempts.length} patrones de registro sospechosos`);
  }

  async getBlockedIPs() {
    console.log(`🚫 Obteniendo IPs bloqueadas...`);
    
    const query = `
      SELECT 
        ip_address,
        reason,
        blocked_by,
        blocked_until,
        created_at
      FROM blocked_ips 
      WHERE blocked_until IS NULL OR blocked_until > NOW()
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);
    this.results.blockedIPs = result.rows || result;
    
    console.log(`✅ Encontradas ${this.results.blockedIPs.length} IPs bloqueadas`);
  }

  generateRecommendations() {
    console.log(`💡 Generando recomendaciones...`);
    
    const recommendations = [];

    // Analizar IPs con muchos intentos fallidos
    this.results.failedLogins.forEach(login => {
      if (login.failed_attempts >= 5) {
        recommendations.push({
          type: 'BLOCK_IP',
          priority: 'HIGH',
          reason: `IP ${login.ip_address} tiene ${login.failed_attempts} intentos fallidos de login`,
          action: `Bloquear IP ${login.ip_address} por 24 horas`,
          ip: login.ip_address
        });
      }
    });

    // Analizar IPs con alto riesgo
    this.results.suspiciousIPs.forEach(ip => {
      if (ip.avg_risk_score > 0.8) {
        recommendations.push({
          type: 'BLOCK_IP',
          priority: 'HIGH',
          reason: `IP ${ip.ip_address} tiene riesgo promedio de ${ip.avg_risk_score.toFixed(2)}`,
          action: `Bloquear IP ${ip.ip_address} por 48 horas`,
          ip: ip.ip_address
        });
      }
    });

    // Analizar patrones de registro sospechosos
    this.results.registrationAttempts.forEach(reg => {
      if (reg.total_attempts > 5 && reg.successful === 0) {
        recommendations.push({
          type: 'BLOCK_IP',
          priority: 'MEDIUM',
          reason: `IP ${reg.ip_address} tiene ${reg.total_attempts} intentos de registro fallidos`,
          action: `Bloquear IP ${reg.ip_address} por 12 horas`,
          ip: reg.ip_address
        });
      }
    });

    // Recomendaciones generales
    if (this.results.highRiskEvents.length > 10) {
      recommendations.push({
        type: 'GENERAL',
        priority: 'MEDIUM',
        reason: 'Alto número de eventos de riesgo detectados',
        action: 'Revisar configuración de reCAPTCHA y ajustar umbrales de riesgo'
      });
    }

    this.results.recommendations = recommendations;
    console.log(`✅ Generadas ${recommendations.length} recomendaciones`);
  }

  async executeRecommendations() {
    if (!this.autoBlock) {
      console.log(`⚠️  Modo automático desactivado. Usa --block para ejecutar recomendaciones automáticamente.`);
      return;
    }

    console.log(`🚀 Ejecutando recomendaciones automáticas...`);
    
    const blockRecommendations = this.results.recommendations.filter(r => r.type === 'BLOCK_IP');
    
    for (const rec of blockRecommendations) {
      try {
        const durationHours = rec.priority === 'HIGH' ? 48 : 24;
        await securityModel.blockIP(rec.ip, rec.reason, null, new Date(Date.now() + durationHours * 60 * 60 * 1000));
        console.log(`✅ Bloqueada IP ${rec.ip}: ${rec.reason}`);
      } catch (error) {
        console.error(`❌ Error bloqueando IP ${rec.ip}:`, error.message);
      }
    }
  }

  exportToCSV() {
    if (!this.exportResults) return;

    console.log(`📊 Exportando resultados a CSV...`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'security-reports');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Exportar IPs sospechosas
    if (this.results.suspiciousIPs.length > 0) {
      const csv = this.arrayToCSV(this.results.suspiciousIPs);
      fs.writeFileSync(path.join(outputDir, `suspicious-ips-${timestamp}.csv`), csv);
    }

    // Exportar eventos de alto riesgo
    if (this.results.highRiskEvents.length > 0) {
      const csv = this.arrayToCSV(this.results.highRiskEvents);
      fs.writeFileSync(path.join(outputDir, `high-risk-events-${timestamp}.csv`), csv);
    }

    // Exportar recomendaciones
    if (this.results.recommendations.length > 0) {
      const csv = this.arrayToCSV(this.results.recommendations);
      fs.writeFileSync(path.join(outputDir, `recommendations-${timestamp}.csv`), csv);
    }

    console.log(`✅ Reportes exportados a ${outputDir}`);
  }

  arrayToCSV(array) {
    if (array.length === 0) return '';
    
    const headers = Object.keys(array[0]);
    const csv = [headers.join(',')];
    
    array.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      });
      csv.push(row.join(','));
    });
    
    return csv.join('\n');
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE ANÁLISIS DE SEGURIDAD');
    console.log('='.repeat(80));
    
    console.log(`⏰ Período analizado: Últimas ${this.hours} horas`);
    console.log(`🎯 Umbral de riesgo: ${this.riskThreshold}`);
    console.log('');
    
    console.log('📈 ESTADÍSTICAS:');
    console.log(`   • IPs sospechosas: ${this.results.suspiciousIPs.length}`);
    console.log(`   • Eventos de alto riesgo: ${this.results.highRiskEvents.length}`);
    console.log(`   • Patrones de login fallido: ${this.results.failedLogins.length}`);
    console.log(`   • Patrones de registro sospechoso: ${this.results.registrationAttempts.length}`);
    console.log(`   • IPs bloqueadas: ${this.results.blockedIPs.length}`);
    console.log(`   • Recomendaciones: ${this.results.recommendations.length}`);
    console.log('');

    if (this.results.suspiciousIPs.length > 0) {
      console.log('🚨 TOP 5 IPs MÁS SOSPECHOSAS:');
      this.results.suspiciousIPs.slice(0, 5).forEach((ip, index) => {
        console.log(`   ${index + 1}. ${ip.ip_address} - Riesgo: ${ip.avg_risk_score.toFixed(2)} - Eventos: ${ip.event_count}`);
      });
      console.log('');
    }

    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMENDACIONES PRINCIPALES:');
      this.results.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority}] ${rec.action}`);
      });
      console.log('');
    }

    console.log('='.repeat(80));
  }

  async run() {
    try {
      console.log('🔒 INICIANDO ANÁLISIS DE SEGURIDAD');
      console.log('='.repeat(50));
      
      this.parseArguments();
      
      await this.analyzeSuspiciousIPs();
      await this.analyzeHighRiskEvents();
      await this.analyzeFailedLogins();
      await this.analyzeRegistrationAttempts();
      await this.getBlockedIPs();
      
      this.generateRecommendations();
      this.printSummary();
      
      if (this.exportResults) {
        this.exportToCSV();
      }
      
      if (this.autoBlock) {
        await this.executeRecommendations();
      }
      
      console.log('✅ Análisis completado exitosamente');
      
    } catch (error) {
      console.error('❌ Error durante el análisis:', error);
      process.exit(1);
    } finally {
      process.exit(0);
    }
  }
}

// Ejecutar el análisis
const analyzer = new SecurityAnalyzer();
analyzer.run(); 