import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
# Wait, the settings module in this repo might be train.settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'train.settings')
django.setup()

from api.models import DatasetMetadata, TrainSchedule, TrainStop

def run():
    print("Loading new_data.json...")
    with open('new_data.json', 'r') as f:
        data = json.load(f)

    if "metadata" in data:
        meta_data = data["metadata"]
        meta_obj = DatasetMetadata.objects.first()
        if not meta_obj:
            meta_obj = DatasetMetadata()
        meta_obj.title = meta_data.get("title", "")
        meta_obj.source = ", ".join(meta_data.get("sources", []))
        meta_obj.compiled = meta_data.get("compiled", "")
        meta_obj.booking_portal = meta_data.get("booking_portal", "")
        meta_obj.disclaimer = meta_data.get("disclaimer", "")
        meta_obj.gauge_legend = meta_data.get("gauge_legend", {})
        meta_obj.save()

    print("Deleting old TrainSchedule data...")
    TrainSchedule.objects.all().delete()

    print("Populating new TrainSchedule data...")
    for item in data.get("intercity_trains", []) + data.get("mail_express_commuter_trains", []):
        schedule = TrainSchedule.objects.create(
            train_id=item["train_no"].replace("/", "_").replace("–", "_").replace("-", "_"),
            train_name=item["train_name"],
            train_no=item["train_no"],
            from_station=item["origin"],
            to_station=item["destination"],
            departure=item["departure"],
            arrival=item["arrival"],
            off_day=item.get("off_days", "None"),
            train_type=item.get("type", "Unknown"),
            schedule_group="intercity" if item.get("type") == "Intercity" else item.get("type", "").lower(),
            gauge=item.get("gauge", ""),
            zone=item.get("zone", ""),
            key_stoppages=item.get("stoppages", [])
        )
        for idx, stop in enumerate(item.get("stoppages", []), start=1):
            TrainStop.objects.create(
                train=schedule,
                stop_order=idx,
                station_name=stop
            )
    print("Successfully updated database!")

if __name__ == "__main__":
    run()
