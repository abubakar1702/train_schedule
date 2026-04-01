from django.db import models


class DatasetMetadata(models.Model):
    title = models.CharField(max_length=200)
    source = models.CharField(max_length=200)
    compiled = models.CharField(max_length=50)
    booking_portal = models.URLField(blank=True)
    disclaimer = models.TextField(blank=True)
    gauge_legend = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.title


class Station(models.Model):
    station_id = models.SlugField(unique=True)
    name = models.CharField(max_length=120, unique=True)
    division = models.CharField(max_length=80)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TrainSchedule(models.Model):
    train_id = models.SlugField(unique=True)
    train_name = models.CharField(max_length=120)
    train_no = models.CharField(max_length=20)
    from_station = models.CharField(max_length=80)
    to_station = models.CharField(max_length=80)
    departure = models.CharField(max_length=20)
    arrival = models.CharField(max_length=20)
    off_day = models.CharField(max_length=30, default="None")
    train_type = models.CharField(max_length=50, default="Intercity")
    schedule_group = models.CharField(max_length=30, default="intercity")
    gauge = models.CharField(max_length=20, blank=True, default="")
    zone = models.CharField(max_length=20, blank=True, default="")
    key_stoppages = models.JSONField(default=list, blank=True)
    source_sl = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ["train_name"]

    def __str__(self):
        return f"{self.train_name} ({self.train_no})"


class TrainStop(models.Model):
    train = models.ForeignKey(
        TrainSchedule,
        on_delete=models.CASCADE,
        related_name="stops",
    )
    station_name = models.CharField(max_length=120)
    stop_order = models.PositiveIntegerField()

    class Meta:
        ordering = ["stop_order"]
        unique_together = ("train", "stop_order")

    def __str__(self):
        return f"{self.train.train_name} - {self.station_name} ({self.stop_order})"


class RouteSummary(models.Model):
    route = models.CharField(max_length=150, unique=True)
    distance_km = models.CharField(max_length=50, blank=True, default="")
    journey_time = models.CharField(max_length=50, blank=True, default="")
    key_trains = models.JSONField(default=list, blank=True)
    notable_stations = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["route"]

    def __str__(self):
        return self.route
