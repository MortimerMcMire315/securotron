#!/bin/bash
#This reroutes port 80 to port 8080 so that we don't have to type :8080 after the address in a web browser.
sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
