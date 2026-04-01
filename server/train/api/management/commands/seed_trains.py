from django.core.management.base import BaseCommand

from api.models import TrainSchedule

DUMMY_TRAINS = [
    {
        "train_id": "sonar-bangla-express",
        "train_name": "Sonar Bangla Express",
        "train_no": "787",
        "from_station": "Dhaka",
        "to_station": "Chattogram",
        "departure": "07:00",
        "arrival": "12:10",
        "off_day": "Wednesday",
    },
    {
        "train_id": "subarna-express",
        "train_name": "Subarna Express",
        "train_no": "701",
        "from_station": "Chattogram",
        "to_station": "Dhaka",
        "departure": "15:00",
        "arrival": "20:10",
        "off_day": "Monday",
    },
    {
        "train_id": "silk-city-express",
        "train_name": "Silk City Express",
        "train_no": "754",
        "from_station": "Dhaka",
        "to_station": "Rajshahi",
        "departure": "14:40",
        "arrival": "20:35",
        "off_day": "Sunday",
    },
    {
        "train_id": "padma-express",
        "train_name": "Padma Express",
        "train_no": "759",
        "from_station": "Rajshahi",
        "to_station": "Dhaka",
        "departure": "23:00",
        "arrival": "04:30",
        "off_day": "Tuesday",
    },
    {
        "train_id": "chitra-express",
        "train_name": "Chitra Express",
        "train_no": "764",
        "from_station": "Khulna",
        "to_station": "Dhaka",
        "departure": "09:00",
        "arrival": "15:55",
        "off_day": "Monday",
    },
    {
        "train_id": "sundarban-express",
        "train_name": "Sundarban Express",
        "train_no": "725",
        "from_station": "Dhaka",
        "to_station": "Khulna",
        "departure": "08:15",
        "arrival": "17:40",
        "off_day": "Wednesday",
    },
    {
        "train_id": "parabat-express",
        "train_name": "Parabat Express",
        "train_no": "709",
        "from_station": "Dhaka",
        "to_station": "Sylhet",
        "departure": "06:20",
        "arrival": "13:00",
        "off_day": "Tuesday",
    },
    {
        "train_id": "upaban-express",
        "train_name": "Upaban Express",
        "train_no": "739",
        "from_station": "Sylhet",
        "to_station": "Dhaka",
        "departure": "22:00",
        "arrival": "05:10",
        "off_day": "Sunday",
    },
    {
        "train_id": "kurigram-express",
        "train_name": "Kurigram Express",
        "train_no": "797",
        "from_station": "Dhaka",
        "to_station": "Rangpur",
        "departure": "20:45",
        "arrival": "06:10",
        "off_day": "Wednesday",
    },
    {
        "train_id": "jamalpur-express",
        "train_name": "Jamalpur Express",
        "train_no": "799",
        "from_station": "Dhaka",
        "to_station": "Mymensingh",
        "departure": "10:20",
        "arrival": "12:45",
        "off_day": "None",
    },
    {
        "train_id": "mohanagar-godhuli",
        "train_name": "Mohanagar Godhuli",
        "train_no": "703",
        "from_station": "Dhaka",
        "to_station": "Comilla",
        "departure": "18:30",
        "arrival": "21:15",
        "off_day": "Friday",
    },
]


class Command(BaseCommand):
    help = "Seed dummy Bangladesh train schedules"

    def handle(self, *args, **kwargs):
        created = 0
        updated = 0
        for payload in DUMMY_TRAINS:
            _, is_created = TrainSchedule.objects.update_or_create(
                train_id=payload["train_id"],
                defaults=payload,
            )
            if is_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete. Created: {created}, Updated: {updated}, Total: {TrainSchedule.objects.count()}"
            )
        )
