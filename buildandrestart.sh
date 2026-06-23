#!/bin/bash
screen -X -S hl quit
make build
screen -dmS hl ./letterofheart
