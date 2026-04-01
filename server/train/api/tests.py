from django.test import TestCase

from .models import TrainSchedule


class TrainApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        TrainSchedule.objects.create(
            train_id="sonar-bangla-express",
            train_name="Sonar Bangla Express",
            train_no="787",
            from_station="Dhaka",
            to_station="Chattogram",
            departure="07:00",
            arrival="12:10",
            off_day="Wednesday",
        )

    def test_stations_endpoint(self):
        response = self.client.get("/api/stations/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["count"], 0)
        self.assertIn("Dhaka", data["stations"])

    def test_filter_trains_by_route(self):
        response = self.client.get(
            "/api/trains/",
            {"from": "Dhaka", "to": "Chattogram"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["trainName"], "Sonar Bangla Express")
