#!/bin/bash

curl -X DELETE http://localhost:9200/access_log | jq

curl -X PUT http://localhost:9200/access_log | jq

curl -X PUT  -H 'Content-Type: application/json' http://localhost:9200/access_log/_mapping -d '{
    "properties": {
        "Domain": {
            "type": "text",
            "fields": {
                "keyword": {
                    "type": "keyword"
                }
            }
        },
        "HappendAt": {
            "type": "date"
        },
        "Method": {
            "type": "text",
            "fields": {
                "keyword": {
                    "type": "keyword"
                }
            }
        },
        "Path":  {
            "type": "text",
            "fields": {
                "keyword": {
                    "type": "keyword"
                }
            }
        }
    }
}' | jq
