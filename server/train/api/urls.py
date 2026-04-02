from django.urls import path

from .views import (
    metadata_detail,
    route_summary_list,
    stations_list,
    train_collection,
    train_detail,
    train_list,
    metro_info,
)

urlpatterns = [
    path("stations/", stations_list, name="stations-list"),
    path("metadata/", metadata_detail, name="metadata-detail"),
    path("routes/", route_summary_list, name="route-summary-list"),
    path("trains/", train_list, name="train-list"),
    path("schedules/", train_collection, name="train-collection"),
    path("schedules/<slug:train_id>/", train_detail, name="train-detail"),
    path("metro/", metro_info, name="metro-info"),
]
