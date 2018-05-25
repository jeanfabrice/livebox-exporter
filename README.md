Livebox Prometheus exporter
==============
Prometheus exporter for Orange Livebox DSL modem. Exposes the following metrics:

* livebox_device_info: A metric with a constant '1' value labeled by several modem characteristics
* livebox_dsl_info: A metric with a constant '1' value labeled by several DSL characteristics
* livebox_mibs_dsl0_bitspersecond: DSL synchronisation rate labeled by direction and type
* livebox_dslstat_errors_total: Total number of DSL errors observed labeled by type (FEC, CRC and HEC) and extremity (ATUC=Central and ATUR=remote, modem)
* livebox_dslstat_erroredseconds_total: Total number of errored seconds labeled by severity
* livebox_dslstat_blocks_total: Total number of DSL blocks exchanged, labeled by type
* livebox_dslstat_loss_of_framing_total: Total number of loss of framing observed
* livebox_mibs_dsl0_upbokle_decibels
* livebox_mibs_dsl0_power_decibelmilliwatts: The amount of power transmitted from the exchange and the modem
* livebox_mibs_dsl0_noisemargin_decibels
* livebox_mibs_dsl0_attenuation_decibels: The degradation of signal over distance
* livebox_reboot_total: Total number of reboots since last reset
* livebox_uptime_seconds_total: Total seconds of device uptime

Docker Usage
------
Build your container using the provided `Dockerfile` : `docker build -t livebox-exporter .`

Create a local `config.json` file using the following template:
```json
{
  "hostname" : "livebox",
  "login"    : "admin",
  "password" : "my_secret_password"
}
```

where:

* `hostname` is the reachable ip/hostname of your modem,
* `admin` is the admin account of the modem,
* `password` is the password used to access the modem GUI.


Start your livebox-exporter container:
`docker run -v config.json:/usr/src/app/config.json -p 9446:9446 --name livebox-exporter livebox-exporter`

The Livebox Prometheus exporter exposes metrics behinds URI /metrics on port 9446.

Want to know more on DSL metrics ?
--------
See:

* https://kitz.co.uk/adsl/linestats.htm
* https://kitz.co.uk/adsl/linestats_explanation.htm
* https://kitz.co.uk/adsl/linestats_errors.htm

Disclaimer
-------
This Prometheus exporter is based on a quick and dirty analysis on part of the Orange Livebox modem API which is not open nor publicly documented. Things can break at any time.

License
-------
MIT