#!/bin/bash

curl -X DELETE http://localhost:9200/access_log | jq

curl -X PUT http://localhost:9200/access_log | jq

curl -X PUT  -H 'Content-Type: application/json' http://localhost:9200/access_log/_mapping -d '{
    "properties": {
        "Domain": {
            "type": "text",
            "fielddata": true
        },
        "HappendAt": {
            "type": "date"
        },
        "Method": {
            "type": "text",
            "fielddata": true
        },
        "Path":  {
            "type": "text",
            "fielddata": true
        }
    }
}' | jq
