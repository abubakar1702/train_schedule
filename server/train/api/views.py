import json
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_http_methods

from .models import DatasetMetadata, RouteSummary, Station, TrainSchedule, TrainStop


def _normalize_station_name(name):
    normalized = " ".join((name or "").strip().lower().replace("-", " ").split())
    return normalized


def _route_stations(train):
    stop_names = [stop.station_name for stop in getattr(train, "stops", []).all()]
    route = [train.from_station, *stop_names, train.to_station]
    normalized = []
    seen = set()
    for station in route:
        key = _normalize_station_name(station)
        if key and key not in seen:
            seen.add(key)
            normalized.append(station)
    return normalized


def _train_matches_route(train, from_station, to_station):
    route = _route_stations(train)
    route_lower = [_normalize_station_name(station) for station in route]
    from_lower = _normalize_station_name(from_station) if from_station else ""
    to_lower = _normalize_station_name(to_station) if to_station else ""

    if from_station and to_station:
        if from_lower not in route_lower or to_lower not in route_lower:
            return False
        return route_lower.index(from_lower) < route_lower.index(to_lower)

    if from_station:
        return from_lower in route_lower

    if to_station:
        return to_lower in route_lower

    return True


def _is_off_day(off_day_text, day_name):
    if not off_day_text or off_day_text.lower() == "none":
        return False
    parts = [item.strip() for item in off_day_text.split(",")]
    day_prefix = day_name[:3].lower()
    return any(part.lower().startswith(day_prefix) for part in parts if part)


@require_GET
def stations_list(request):
    stations = list(Station.objects.values_list("name", flat=True))
    if not stations:
        stations = sorted(
            set(TrainSchedule.objects.values_list("from_station", flat=True))
            | set(TrainSchedule.objects.values_list("to_station", flat=True))
        )
    return JsonResponse({"count": len(stations), "stations": stations})


@require_GET
def train_list(request):
    from_station = request.GET.get("from", "").strip()
    to_station = request.GET.get("to", "").strip()
    travel_date = request.GET.get("date", "").strip()

    trains_qs = TrainSchedule.objects.prefetch_related("stops").all()

    day_name = ""
    if travel_date:
        try:
            day_name = datetime.strptime(travel_date, "%Y-%m-%d").strftime("%A")
        except ValueError:
            return JsonResponse(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=400,
            )

    matched_trains = [
        train for train in trains_qs if _train_matches_route(train, from_station, to_station)
    ]
    if day_name:
        matched_trains = [
            train for train in matched_trains if not _is_off_day(train.off_day, day_name)
        ]

    trains = [
        {
            "id": train.train_id,
            "trainName": train.train_name,
            "trainNo": train.train_no,
            "from": train.from_station,
            "to": train.to_station,
            "departure": train.departure,
            "arrival": train.arrival,
            "offDay": train.off_day,
            "type": train.train_type,
            "group": train.schedule_group,
            "gauge": train.gauge,
            "zone": train.zone,
            "keyStoppages": [stop.station_name for stop in train.stops.all()],
            "route": _route_stations(train),
        }
        for train in matched_trains
    ]

    return JsonResponse(
        {
            "count": len(trains),
            "filters": {"from": from_station, "to": to_station, "date": travel_date},
            "excludedOffDay": day_name,
            "results": trains,
        }
    )


@require_http_methods(["GET", "POST"])
def train_collection(request):
    if request.method == "GET":
        trains = TrainSchedule.objects.prefetch_related("stops").all()
        payload = [
            {
                "id": train.id,
                "trainId": train.train_id,
                "trainName": train.train_name,
                "trainNo": train.train_no,
                "from": train.from_station,
                "to": train.to_station,
                "departure": train.departure,
                "arrival": train.arrival,
                "offDay": train.off_day,
                "type": train.train_type,
                "group": train.schedule_group,
                "gauge": train.gauge,
                "zone": train.zone,
                "keyStoppages": [stop.station_name for stop in train.stops.all()],
            }
            for train in trains
        ]
        return JsonResponse({"count": len(payload), "results": payload})

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    required = ["trainId", "trainName", "trainNo", "from", "to", "departure", "arrival"]
    missing = [field for field in required if not body.get(field)]
    if missing:
        return JsonResponse({"detail": f"Missing required fields: {', '.join(missing)}"}, status=400)

    train, created = TrainSchedule.objects.update_or_create(
        train_id=body["trainId"],
        defaults={
            "train_name": body["trainName"],
            "train_no": body["trainNo"],
            "from_station": body["from"],
            "to_station": body["to"],
            "departure": body["departure"],
            "arrival": body["arrival"],
            "off_day": body.get("offDay", "None"),
            "train_type": body.get("type", "Intercity"),
            "schedule_group": body.get("group", "intercity"),
            "gauge": body.get("gauge", ""),
            "zone": body.get("zone", ""),
            "key_stoppages": body.get("keyStoppages", []),
        },
    )
    if "keyStoppages" in body:
        train.stops.all().delete()
        for index, station_name in enumerate(body.get("keyStoppages", []), start=1):
            TrainStop.objects.create(
                train=train,
                station_name=station_name,
                stop_order=index,
            )
    return JsonResponse(
        {"id": train.id, "trainId": train.train_id, "created": created},
        status=201 if created else 200,
    )


@require_http_methods(["GET", "PUT", "DELETE"])
def train_detail(request, train_id):
    try:
        train = TrainSchedule.objects.prefetch_related("stops").get(train_id=train_id)
    except TrainSchedule.DoesNotExist:
        return JsonResponse({"detail": "Train not found."}, status=404)

    if request.method == "GET":
        return JsonResponse(
            {
                "id": train.id,
                "trainId": train.train_id,
                "trainName": train.train_name,
                "trainNo": train.train_no,
                "from": train.from_station,
                "to": train.to_station,
                "departure": train.departure,
                "arrival": train.arrival,
                "offDay": train.off_day,
                "type": train.train_type,
                "group": train.schedule_group,
                "gauge": train.gauge,
                "zone": train.zone,
                "keyStoppages": [stop.station_name for stop in train.stops.all()],
            }
        )

    if request.method == "DELETE":
        train.delete()
        return JsonResponse({}, status=204)

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    for field, model_field in (
        ("trainName", "train_name"),
        ("trainNo", "train_no"),
        ("from", "from_station"),
        ("to", "to_station"),
        ("departure", "departure"),
        ("arrival", "arrival"),
        ("offDay", "off_day"),
        ("type", "train_type"),
        ("group", "schedule_group"),
        ("gauge", "gauge"),
        ("zone", "zone"),
    ):
        if field in body and body[field] is not None:
            setattr(train, model_field, body[field])

    train.save()
    if "keyStoppages" in body and isinstance(body["keyStoppages"], list):
        train.stops.all().delete()
        for index, station_name in enumerate(body["keyStoppages"], start=1):
            TrainStop.objects.create(
                train=train,
                station_name=station_name,
                stop_order=index,
            )
    return JsonResponse({"trainId": train.train_id, "updated": True})


@require_GET
def metadata_detail(request):
    meta = DatasetMetadata.objects.first()
    if not meta:
        return JsonResponse({}, status=404)
    return JsonResponse(
        {
            "title": meta.title,
            "source": meta.source,
            "compiled": meta.compiled,
            "bookingPortal": meta.booking_portal,
            "disclaimer": meta.disclaimer,
            "gaugeLegend": meta.gauge_legend,
        }
    )


@require_GET
def route_summary_list(request):
    routes = RouteSummary.objects.all()
    payload = [
        {
            "route": route.route,
            "distanceKm": route.distance_km,
            "journeyTime": route.journey_time,
            "keyTrains": route.key_trains,
            "notableStations": route.notable_stations,
        }
        for route in routes
    ]
    return JsonResponse({"count": len(payload), "results": payload})


from .models import MetroSystem

@require_GET
def metro_info(request):
    system = MetroSystem.objects.first()
    if not system:
        return JsonResponse({"detail": "Metro data not available"}, status=404)
        
    stations = system.stations.all()
    
    payload = {
        "metro_rail": {
            "name": system.name,
            "line": system.line,
            "operator": system.operator,
            "route": system.route,
            "total_length_km": float(system.total_length_km),
            "total_stations": system.total_stations,
            "status": system.status
        },
        "schedule": system.schedule,
        "ticket_info": system.ticket_info,
        "source": system.source,
        "last_updated": system.last_updated,
        "stations": [
            {
                "number": st.number,
                "name": st.name,
                "role": st.role,
                "toward_motijheel": st.toward_motijheel,
                "toward_uttara_north": st.toward_uttara_north
            }
            for st in stations
        ]
    }
    return JsonResponse(payload)
