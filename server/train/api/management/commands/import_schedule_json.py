import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from api.models import DatasetMetadata, RouteSummary, TrainSchedule, TrainStop


class Command(BaseCommand):
    help = "Import Bangladesh railway schedule JSON into database"

    def add_arguments(self, parser):
        parser.add_argument("json_file", type=str, help="Path to schedule JSON file")

    def handle(self, *args, **options):
        json_path = Path(options["json_file"])
        if not json_path.exists():
            raise CommandError(f"File not found: {json_path}")

        payload = json.loads(json_path.read_text(encoding="utf-8"))

        metadata = payload.get("metadata", {})
        if metadata:
            DatasetMetadata.objects.all().delete()
            DatasetMetadata.objects.create(
                title=metadata.get("title", "Bangladesh Railway Train Schedule"),
                source=metadata.get("source", ""),
                compiled=metadata.get("compiled", ""),
                booking_portal=metadata.get("booking_portal", ""),
                disclaimer=metadata.get("disclaimer", ""),
                gauge_legend=metadata.get("gauge_legend", {}),
            )

        created = 0
        updated = 0

        def upsert_train(item, group_name):
            nonlocal created, updated
            train_id = f"{item.get('train_name', '').lower().replace(' ', '-')}-{item.get('sl')}"
            key_stoppages = item.get("key_stoppages", [])
            defaults = {
                "train_name": item.get("train_name", ""),
                "train_no": item.get("train_no", ""),
                "from_station": item.get("origin", ""),
                "to_station": item.get("destination", ""),
                "departure": item.get("departure", ""),
                "arrival": item.get("arrival", ""),
                "off_day": item.get("off_days") or "None",
                "train_type": item.get("type", ""),
                "schedule_group": group_name,
                "gauge": item.get("gauge", ""),
                "zone": item.get("zone", ""),
                "key_stoppages": key_stoppages,
                "source_sl": item.get("sl"),
            }
            train, is_created = TrainSchedule.objects.update_or_create(
                train_id=train_id,
                defaults=defaults,
            )
            train.stops.all().delete()
            for idx, station_name in enumerate(key_stoppages, start=1):
                TrainStop.objects.create(
                    train=train,
                    station_name=station_name,
                    stop_order=idx,
                )
            if is_created:
                created += 1
            else:
                updated += 1

        for train in payload.get("intercity_trains", []):
            upsert_train(train, "intercity")

        for train in payload.get("mail_express_trains", []):
            upsert_train(train, "mail_express")

        RouteSummary.objects.all().delete()
        route_rows = payload.get("routes", [])
        for route in route_rows:
            RouteSummary.objects.create(
                route=route.get("route", ""),
                distance_km=route.get("distance_km", ""),
                journey_time=route.get("journey_time", ""),
                key_trains=route.get("key_trains", []),
                notable_stations=route.get("notable_stations", []),
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Import complete. Trains created={created}, updated={updated}, routes={len(route_rows)}"
            )
        )
