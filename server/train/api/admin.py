from django.contrib import admin

from .models import DatasetMetadata, RouteSummary, Station, TrainSchedule, TrainStop


@admin.register(DatasetMetadata)
class DatasetMetadataAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "compiled")


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ("name", "station_id", "division")
    list_filter = ("division",)
    search_fields = ("name", "station_id", "division")


@admin.register(TrainSchedule)
class TrainScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "train_name",
        "train_no",
        "from_station",
        "to_station",
        "departure",
        "arrival",
        "off_day",
        "schedule_group",
    )
    list_filter = ("from_station", "to_station", "off_day", "schedule_group", "zone", "gauge")
    search_fields = ("train_name", "train_no", "from_station", "to_station", "train_id")


@admin.register(TrainStop)
class TrainStopAdmin(admin.ModelAdmin):
    list_display = ("train", "stop_order", "station_name")
    list_filter = ("train",)
    search_fields = ("train__train_name", "station_name")


@admin.register(RouteSummary)
class RouteSummaryAdmin(admin.ModelAdmin):
    list_display = ("route", "distance_km", "journey_time")
    search_fields = ("route",)
