from django.urls import path

from .views import calculator_view

app_name = "calculator"

urlpatterns = [
    path("", calculator_view, name="home"),
]
