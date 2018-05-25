#!/usr/bin/env node
var debug      = require( 'debug' )( 'app:main' );
var express    = require( 'express' );
var server     = express();
var promclient = require( 'prom-client' );
var async      = require( 'async' );
var config     = require( './config.json' );
var livebox    = require( 'livebox-collect' )( config.hostname, config.login, config.password );

var livebox_device_info = new promclient.Gauge({
  name: 'livebox_device_info',
  help: "A metric with a constant '1' value labeled by several modem characteristics",
  labelNames: [
    'Manufacturer',
    'ModelName',
    'ProductClass',
    'SerialNumber',
    'HardwareVersion',
    'SoftwareVersion',
    'AdditionalHardwareVersion',
    'AdditionalSoftwareVersion',
    'RescueVersion',
    'ProvisioningCode',
    'BaseMAC',
    'ExternalIPAddress',
    'AdditionalSoftwareVersion',
    'HardwareVersion',
    'Bootloader',
    'RescueBootloader',
    'DeviceStatus'
  ]
});

var livebox_dsl_info = new promclient.Gauge({
  name: 'livebox_dsl_info',
  help: "A metric with a constant '1' value labeled by several DSL characteristics",
  labelNames: [
    'StandardUsed',
    'StandardsSupported',
    'CurrentProfile',
    'ModulationHint',
    'ModulationType',
    'ChannelEncapsulationType',
    'DataPath',
    'LinkStatus'
  ]
});

var livebox_mibs_dsl0_bitspersecond = new promclient.Gauge({
  name: 'livebox_mibs_dsl0_bitspersecond',
  help: 'DSL synchronisation rate labeled by direction and type',
  labelNames: [
    'SerialNumber',
    'type',
    'direction'
  ]
});

var livebox_dslstat_errors_total = new promclient.Gauge({
  name: 'livebox_dslstat_errors_total',
  help: 'Total number of DSL errors observed labeled by type (FEC, CRC and HEC) and extremity (ATUC=Central and ATUR=remote, modem)',
  labelNames: [
    'SerialNumber',
    'type',
    'extremity'
  ]
});

var livebox_dslstat_erroredseconds_total = new promclient.Gauge({
  name: 'livebox_dslstat_erroredseconds_total',
  help: 'Total number of errored seconds labeled by severity',
  labelNames: [
    'SerialNumber',
    'severity'
  ]
});

var livebox_dslstat_blocks_total = new promclient.Gauge({
  name: 'livebox_dslstat_blocks_total',
  help: 'Total number of DSL blocks exchanged, labeled by type',
  labelNames: [
    'SerialNumber',
    'type'
  ]
});

var livebox_dslstat_loss_of_framing_total = new promclient.Gauge({
  name: 'livebox_dslstat_loss_of_framing_total',
  help: 'Total number of loss of framing observed',
  labelNames: [
    'SerialNumber'
  ]
});

var livebox_mibs_dsl0_upbokle_decibels = new promclient.Gauge({
  name: 'livebox_mibs_dsl0_upbokle_decibels',
  help: 'Example of a gauge',
  labelNames: [
    'SerialNumber'
  ]
});

var livebox_mibs_dsl0_power_decibelmilliwatts = new promclient.Gauge({
  name: 'livebox_mibs_dsl0_power_decibelmilliwatts',
  help: 'The amount of power transmitted from the exchange and the modem.',
  labelNames: [
    'SerialNumber',
    'direction'
  ]
});

var livebox_mibs_dsl0_noisemargin_decibels = new promclient.Gauge({
  name: 'livebox_mibs_dsl0_noisemargin_decibels',
  help: 'Example of a gauge',
  labelNames: [
    'SerialNumber',
    'direction'
  ]
});

var livebox_mibs_dsl0_attenuation_decibels = new promclient.Gauge({
  name: 'livebox_mibs_dsl0_attenuation_decibels',
  help: 'The degradation of signal over distance',
  labelNames: [
    'SerialNumber',
    'type',
    'direction'
  ]
});

var livebox_reboots_total = new promclient.Gauge({
  name: 'livebox_reboot_total',
  help: 'Total number of reboots since last reset',
  labelNames: [
    'SerialNumber'
  ]
});

var livebox_uptime_seconds_total = new promclient.Gauge({
  name: 'livebox_uptime_seconds_total',
  help: 'Total seconds of device uptime',
  labelNames: [
    'SerialNumber'
  ]
});

function collect() {
  livebox.connect( function( err ) {
    if( err ) {
      console.error( 'Auth error:', err );
      process.exit( 1 );
    }
    async.parallel({
      'deviceInfo' : function( callback ) {
        livebox.deviceInfo( function( err, data ) {
          callback( err, data.status );
        });
      },
      'getDSLStats' : function( callback ) {
        livebox.getDSLStats( function( err, data ) {
          callback( err, data.status );
        });
      },
      'getMibs-dsl' : function( callback ) {
        livebox.getMibs( 'dsl', function( err, data ) {
          callback( err, data.status.dsl );
        });
      }
    }, function( err, result ) {
      if( err ) {
          console.error( err );
          return;
      }
      debug( result );
      livebox_device_info.set({
        'Manufacturer'              : result.deviceInfo.Manufacturer,
        'ModelName'                 : result.deviceInfo.ModelName,
        'ProductClass'              : result.deviceInfo.ProductClass,
        'SerialNumber'              : result.deviceInfo.SerialNumber,
        'HardwareVersion'           : result.deviceInfo.HardwareVersion,
        'SoftwareVersion'           : result.deviceInfo.SoftwareVersion,
        'AdditionalHardwareVersion' : result.deviceInfo.AdditionalHardwareVersion,
        'AdditionalSoftwareVersion' : result.deviceInfo.AdditionalSoftwareVersion,
        'Bootloader'                : result.deviceInfo['X_SOFTATHOME-COM_AdditionalSoftwareVersions'],
        'RescueBootloader'          : result.deviceInfo['X_SOFTATHOME-COM_AdditionalSoftwareVersions'],
        'RescueVersion'             : result.deviceInfo.RescueVersion,
        'ProvisioningCode'          : result.deviceInfo.ProvisioningCode,
        'BaseMAC'                   : result.deviceInfo.BaseMAC,
        'ExternalIPAddress'         : result.deviceInfo.ExternalIPAddress,
        'HardwareVersion'           : result.deviceInfo.HardwareVersion,
        'DeviceStatus'              : result.deviceInfo.DeviceStatus
      }, 1 )


      livebox_dsl_info.set({
        'StandardUsed'             : result['getMibs-dsl'].dsl0.StandardUsed,
        'StandardsSupported'       : result['getMibs-dsl'].dsl0.StandardsSupported,
        'CurrentProfile'           : result['getMibs-dsl'].dsl0.CurrentProfile,
        'ModulationType'           : result['getMibs-dsl'].dsl0.ModulationType,
        'ModulationHint'           : result['getMibs-dsl'].dsl0.ModulationHint,
        'ChannelEncapsulationType' : result['getMibs-dsl'].dsl0.ChannelEncapsulationType,
        'DataPath'                 : result['getMibs-dsl'].dsl0.DataPath,
        'LinkStatus'               : result['getMibs-dsl'].dsl0.LinkStatus
      }, 1 )


      livebox_reboots_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber
      }, result.deviceInfo.NumberOfReboots )


      livebox_uptime_seconds_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber
      }, result.deviceInfo.UpTime )


      livebox_mibs_dsl0_bitspersecond.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'direction'    : 'upstream',
        'type'         : 'current'
      }, result['getMibs-dsl'].dsl0.UpstreamCurrRate )
      livebox_mibs_dsl0_bitspersecond.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'direction'    : 'downstream',
        'type'         : 'current'
      }, result['getMibs-dsl'].dsl0.DownstreamCurrRate )
      livebox_mibs_dsl0_bitspersecond.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'direction'    : 'upstream',
        'type'         : 'max'
      }, result['getMibs-dsl'].dsl0.UpstreamMaxRate )
      livebox_mibs_dsl0_bitspersecond.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'direction'    : 'downstream',
        'type'         : 'max'
      }, result['getMibs-dsl'].dsl0.DownstreamMaxRate )


      livebox_dslstat_errors_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'FEC',
        'extremity'    : 'ATUR'
      }, result.getDSLStats.FECErrors )
      livebox_dslstat_errors_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'FEC',
        'extremity'    : 'ATUC'
      }, result.getDSLStats.ATUCFECErrors )
      livebox_dslstat_errors_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'HEC',
        'extremity'    : 'ATUR'
      }, result.getDSLStats.HECErrors )
      livebox_dslstat_errors_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'HEC',
        'extremity'    : 'ATUC'
      }, result.getDSLStats.ATUCHECErrors )
      livebox_dslstat_errors_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'CRC',
        'extremity'    : 'ATUR'
      }, result.getDSLStats.CRCErrors )
      livebox_dslstat_errors_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'CRC',
        'extremity'    : 'ATUC'
      }, result.getDSLStats.ATUCCRCErrors )


      livebox_dslstat_erroredseconds_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'severity'     : 'severe'
      }, result.getDSLStats.SeverelyErroredSecs )
      livebox_dslstat_erroredseconds_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'severity'     : 'minor'
      }, result.getDSLStats.ErroredSecs )


      livebox_dslstat_blocks_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'receive'
      }, result.getDSLStats.ReceiveBlocks )
      livebox_dslstat_blocks_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'transmit'
      }, result.getDSLStats.TransmitBlocks )


      livebox_dslstat_loss_of_framing_total.set({
        'SerialNumber' : result.deviceInfo.SerialNumber
      }, result.getDSLStats.LossOfFraming )


      livebox_mibs_dsl0_upbokle_decibels.set({
        'SerialNumber' : result.deviceInfo.SerialNumber
      }, result['getMibs-dsl'].dsl0.UPBOKLE / 10 )


      livebox_mibs_dsl0_power_decibelmilliwatts.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'direction'    : 'downstream'
      }, result['getMibs-dsl'].dsl0.DownstreamPower / 10 )
      livebox_mibs_dsl0_power_decibelmilliwatts.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'direction'    : 'upstream'
      }, result['getMibs-dsl'].dsl0.UpstreamPower / 10 )

      livebox_mibs_dsl0_noisemargin_decibels.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'direction'    : 'downstream'
      }, result['getMibs-dsl'].dsl0.DownstreamNoiseMargin / 10 )
      livebox_mibs_dsl0_noisemargin_decibels.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'direction'    : 'upstream'
      }, result['getMibs-dsl'].dsl0.UpstreamNoiseMargin / 10 )


      livebox_mibs_dsl0_attenuation_decibels.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'signal',
        'direction'    : 'downstream'
      }, result['getMibs-dsl'].dsl0.DownstreamAttenuation / 10 )
      livebox_mibs_dsl0_attenuation_decibels.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'signal',
        'direction'    : 'upstream'
      }, result['getMibs-dsl'].dsl0.UpstreamAttenuation / 10 )
      livebox_mibs_dsl0_attenuation_decibels.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'line',
        'direction'    : 'downstream'
      }, result['getMibs-dsl'].dsl0.DownstreamLineAttenuation / 10 )
      livebox_mibs_dsl0_attenuation_decibels.set({
        'SerialNumber' : result.deviceInfo.SerialNumber,
        'type'         : 'line',
        'direction'    : 'upstream'
      }, result['getMibs-dsl'].dsl0.UpstreamLineAttenuation / 10 )

    })
  })
}

setInterval( collect, 10000 );

server.get('/metrics', function ( req, res ) {
  res.set( 'Content-Type', promclient.register.contentType );
  res.end( promclient.register.metrics() );
});

console.log('Server listening to 9446, metrics exposed on /metrics endpoint');
server.listen( 9446 );
