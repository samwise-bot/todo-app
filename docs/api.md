# API Examples

This document captures request/response snippets for principal, board, column, and weekly review endpoints.

Machine-readable OpenAPI contract:
- Source: `docs/openapi/openapi-source.json`
- Generated JSON: `docs/openapi/openapi.json`
- Regenerate with `./ops/run/generate-openapi.sh`

## Principals

### Create principal

Request:
```http
POST /api/principals
Content-Type: application/json

{
  "kind": "human",
  "handle": "alice",
  "displayName": "Alice Nguyen"
}
```

Response `201`:
```json
{
  "id": 1,
  "kind": "human",
  "handle": "alice",
  "displayName": "Alice Nguyen",
  "createdAt": "2026-03-03T00:00:00Z"
}
```

### List principals

Request:
```http
GET /api/principals?page=1&pageSize=20&kind=human&q=alice
```

Query params:
- `page` (optional): positive integer, default `1`
- `pageSize` (optional): integer `1..100`, default `20`
- `kind` (optional): `human` or `agent`
- `q` (optional): case-insensitive match on `handle` or `displayName`

Response `200`:
```json
{
  "items": [
    {
      "id": 1,
      "kind": "human",
      "handle": "alice",
      "displayName": "Alice Nguyen",
      "createdAt": "2026-03-03T00:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

## Tasks

### List tasks

Request:
```http
GET /api/tasks?page=1&pageSize=20&state=next&projectId=3&assigneeId=1&boardColumnId=12&q=release
```

Query params:
- `page` (optional): positive integer, default `1`
- `pageSize` (optional): integer `1..100`, default `20`
- `state` (optional): one valid task state (`inbox`, `next`, `waiting`, `scheduled`, `done`, `someday`, `reference`)
- `projectId` (optional): positive integer
- `assigneeId` (optional): positive integer
- `boardColumnId` (optional): positive integer
- `q` (optional): case-insensitive match on `title` or `description`

Response `200`:
```json
{
  "items": [
    {
      "id": 33,
      "title": "Prepare launch notes",
      "description": "",
      "state": "next",
      "projectId": 3,
      "assigneeId": 1,
      "boardColumnId": 12,
      "priority": 1,
      "dueAt": "2026-03-05T17:00:00Z",
      "createdAt": "2026-03-03T00:00:00Z",
      "updatedAt": "2026-03-03T00:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

## Boards

### Create board

Request:
```http
POST /api/boards
Content-Type: application/json

{
  "projectId": 3,
  "name": "Delivery Board"
}
```

Response `201`:
```json
{
  "id": 7,
  "projectId": 3,
  "name": "Delivery Board",
  "createdAt": "2026-03-03T00:00:00Z"
}
```

### Update board

Request:
```http
PATCH /api/boards/7
Content-Type: application/json

{
  "name": "Delivery"
}
```

Response `200`:
```json
{
  "id": 7,
  "projectId": 3,
  "name": "Delivery",
  "createdAt": "2026-03-03T00:00:00Z"
}
```

### Delete board

Request:
```http
DELETE /api/boards/7
```

Response `200`:
```json
{ "ok": true }
```

## Columns

### Create column

Request:
```http
POST /api/columns
Content-Type: application/json

{
  "boardId": 7,
  "name": "Waiting",
  "position": 20
}
```

Response `201`:
```json
{
  "id": 12,
  "boardId": 7,
  "name": "Waiting",
  "position": 20,
  "createdAt": "2026-03-03T00:00:00Z"
}
```

### Update column

Request:
```http
PATCH /api/columns/12
Content-Type: application/json

{
  "name": "Blocked",
  "position": 30
}
```

Response `200`:
```json
{
  "id": 12,
  "boardId": 7,
  "name": "Blocked",
  "position": 30,
  "createdAt": "2026-03-03T00:00:00Z"
}
```

### Delete column

Request:
```http
DELETE /api/columns/12
```

Response `200`:
```json
{ "ok": true }
```

## Reviews

### Weekly review stale tasks

Request:
```http
GET /api/reviews/weekly?thresholdDays=14
```

Response `200`:
```json
{
  "thresholdDays": 14,
  "count": 3,
  "sections": {
    "waiting": [
      {
        "id": 33,
        "title": "Follow up on vendor",
        "description": "",
        "state": "waiting",
        "projectId": 3,
        "createdAt": "2026-02-01T09:00:00Z",
        "updatedAt": "2026-02-04T10:00:00Z"
      }
    ],
    "someday": [
      {
        "id": 41,
        "title": "Potential idea: workflow bot",
        "description": "",
        "state": "someday",
        "createdAt": "2026-02-05T11:00:00Z",
        "updatedAt": "2026-02-10T08:00:00Z"
      }
    ],
    "overdueScheduled": [
      {
        "id": 57,
        "title": "Prepare launch notes",
        "description": "",
        "state": "scheduled",
        "projectId": 3,
        "dueAt": "2026-02-20T00:00:00Z",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-12T08:00:00Z"
      }
    ]
  },
  "staleTasks": [
    {
      "id": 33,
      "title": "Follow up on vendor",
      "description": "",
      "state": "waiting",
      "projectId": 3,
      "createdAt": "2026-02-01T09:00:00Z",
      "updatedAt": "2026-02-04T10:00:00Z"
    },
    {
      "id": 41,
      "title": "Potential idea: workflow bot",
      "description": "",
      "state": "someday",
      "createdAt": "2026-02-05T11:00:00Z",
      "updatedAt": "2026-02-10T08:00:00Z"
    }
  ]
}
```
