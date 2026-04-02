from django.contrib import admin

from .models import (
    DatasetMetadata, RouteSummary, Station, TrainSchedule, TrainStop,
    MetroSystem, MetroStation
)

@admin.register(DatasetMetadata)
class DatasetMetadataAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "compiled")
    fieldsets = (
        ("Basic Info", {"fields": ("title", "source", "compiled", "booking_portal")}),
        ("Additional", {"fields": ("disclaimer", "gauge_legend")}),
    )


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ("name", "station_id", "division")
    list_filter = ("division",)
    search_fields = ("name", "station_id", "division")


class TrainStopInline(admin.TabularInline):
    model = TrainStop
    extra = 1
    ordering = ("stop_order",)
    fields = ("stop_order", "station_name")


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
    inlines = [TrainStopInline]
    fieldsets = (
        ("Core", {"fields": ("train_id", "train_name", "train_no", "train_type", "schedule_group")}),
        ("Route", {"fields": ("from_station", "to_station", "departure", "arrival", "off_day")}),
        ("Tech", {"fields": ("gauge", "zone", "source_sl")}),
        ("Raw Import Data", {"fields": ("key_stoppages",), "classes": ("collapse",)}),
    )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        train = form.instance
        ordered_stops = list(train.stops.order_by("stop_order").values_list("station_name", flat=True))
        # Keep key_stoppages in sync for API/backward compatibility.
        train.key_stoppages = ordered_stops
        train.save(update_fields=["key_stoppages"])


@admin.register(TrainStop)
class TrainStopAdmin(admin.ModelAdmin):
    list_display = ("train", "stop_order", "station_name")
    list_filter = ("train__schedule_group", "train__zone", "train")
    search_fields = ("train__train_name", "train__train_no", "station_name")
    ordering = ("train__train_name", "stop_order")


@admin.register(RouteSummary)
class RouteSummaryAdmin(admin.ModelAdmin):
    list_display = ("route", "distance_km", "journey_time")
    search_fields = ("route",)

@admin.register(MetroSystem)
class MetroSystemAdmin(admin.ModelAdmin):
    list_display = ("name", "line", "operator", "status")

@admin.register(MetroStation)
class MetroStationAdmin(admin.ModelAdmin):
    list_display = ("number", "name", "role", "system")
    list_filter = ("system",)
    ordering = ("system", "number")
