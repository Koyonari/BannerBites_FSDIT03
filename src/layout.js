/* const layout = {
    "rows": 2,
    "columns": 3,
    "gridItems": [
      {
        "index": 0,
        "row": 0,
        "column": 0,
        "scheduledAds": [
          {
            "id": "916fa253-b317-4d29-a00d-722f42f7610a",
            "scheduledDateTime": "2024-10-24T19:33",
            "ad": {
              "id": "460054eb-e8f2-4f25-9681-cf6aba6c05a5",
              "type": "image",
              "content": {
                "src": "https://via.placeholder.com/150",
                "title": "Image Ad",
                "description": "This is an image ad."
              }
            }
          }
        ],
        "isMerged": true,
        "rowSpan": 1,
        "colSpan": 2,
        "mergeDirection": "horizontal",
        "selectedCells": [
          0,
          1
        ]
      },
      {
        "index": 2,
        "row": 0,
        "column": 2,
        "scheduledAds": [
          {
            "id": "0a3fb66a-6159-479b-a2ec-3b3521c32af2",
            "scheduledDateTime": "2024-10-24T19:33",
            "ad": {
              "id": "32b28e8b-c6ea-41e9-9e67-4578bdd55f8b",
              "type": "text",
              "content": {
                "title": "Text Ad",
                "description": "This is a text ad."
              }
            }
          }
        ],
        "isMerged": true,
        "rowSpan": 2,
        "colSpan": 1,
        "mergeDirection": "selection",
        "selectedCells": [
          2,
          5
        ]
      },
      {
        "index": 3,
        "row": 1,
        "column": 0,
        "scheduledAds": [
          {
            "id": "4afd8bd3-1242-4788-a06f-2a5913481938",
            "scheduledDateTime": "2024-10-24T19:33",
            "ad": {
              "id": "f2d6f244-799c-43f2-95e2-63451ac75ef5",
              "type": "video",
              "content": {
                "src": "https://sample-videos.com/video123/mp4/480/asdasdas.mp4",
                "title": "Video Ad",
                "description": "This is a video ad."
              }
            }
          }
        ],
        "isMerged": true,
        "rowSpan": 1,
        "colSpan": 2,
        "mergeDirection": "horizontal",
        "selectedCells": [
          3,
          4
        ]
      }
    ]
  }; */
  

const layout = {
    "rows": 2,
    "columns": 3,
    "gridItems": [
      {
        "index": 0,
        "row": 0,
        "column": 0,
        "scheduledAds": [
          {
            "id": "916fa253-b317-4d29-a00d-722f42f7610a",
            "scheduledDateTime": "2023-10-25T12:00:00",
            "ad": {
              "id": "460054eb-e8f2-4f25-9681-cf6aba6c05a5",
              "type": "image",
              "content": {
                "src": "https://via.placeholder.com/150",
                "title": "Image Ad",
                "description": "This is an image ad."
              },
              "styles": {
                "color": "#ffffff",
                "borderColor": "#007bff",
                "backgroundColor": "#007bff",
                "borderWidth": "2px",
                "borderStyle": "solid"
              }
            }
          }
        ],
        "isMerged": true,
        "rowSpan": 1,
        "colSpan": 2,
        "mergeDirection": "horizontal",
        "selectedCells": [0, 1]
      },
      {
        "index": 2,
        "row": 0,
        "column": 2,
        "scheduledAds": [
          {
            "id": "0a3fb66a-6159-479b-a2ec-3b3521c32af2",
            "scheduledDateTime": "2023-10-25T12:00:00",
            "ad": {
              "id": "32b28e8b-c6ea-41e9-9e67-4578bdd55f8b",
              "type": "text",
              "content": {
                "title": "Text Ad",
                "description": "This is a text ad."
              },
              "styles": {
                "color": "#333333",
                "borderColor": "#28a745",
                "backgroundColor": "#e9ffe9",
                "borderWidth": "2px",
                "borderStyle": "dashed"
              }
            }
          }
        ],
        "isMerged": true,
        "rowSpan": 2,
        "colSpan": 1,
        "mergeDirection": "selection",
        "selectedCells": [2, 5]
      },
      {
        "index": 3,
        "row": 1,
        "column": 0,
        "scheduledAds": [
          {
            "id": "4afd8bd3-1242-4788-a06f-2a5913481938",
            "scheduledDateTime": "2023-10-25T12:00:00",
            "ad": {
              "id": "f2d6f244-799c-43f2-95e2-63451ac75ef5",
              "type": "video",
              "content": {
                "src": "https://sample-videos.com/video123/mp4/480/asdasdas.mp4",
                "title": "Video Ad",
                "description": "This is a video ad."
              },
              "styles": {
                "color": "#ffffff",
                "borderColor": "#dc3545",
                "backgroundColor": "#dc3545",
                "borderWidth": "2px",
                "borderStyle": "solid"
              }
            }
          }
        ],
        "isMerged": true,
        "rowSpan": 1,
        "colSpan": 2,
        "mergeDirection": "horizontal",
        "selectedCells": [3, 4]
      }
    ]
  };
export default layout;