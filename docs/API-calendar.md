# API: Team Calendar

## Purpose

The team calendar needs a single endpoint that returns approved leave requests
for an organization over a date range, with optional team filtering. This keeps
calendar views consistent across clients while avoiding multiple round trips.

## Endpoint

`GET /api/calendar`

### Query Params

- `startDate` (YYYY-MM-DD, optional) - Inclusive range start
- `endDate` (YYYY-MM-DD, optional) - Inclusive range end
- `teamId` (optional) - Filter to a specific team

If no dates are provided, the endpoint defaults to the current month.

### Auth + Access

- Requires an authenticated user with an active organization membership.
- Returns only approved leave requests.

## Response

```json
{
  "data": [
    {
      "id": "leave_request_id",
      "startDate": "2024-08-05",
      "endDate": "2024-08-07",
      "user": {
        "id": "user_id",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatarUrl": null
      },
      "leaveType": {
        "code": "vacation",
        "color": "#3B82F6"
      }
    }
  ]
}
```
