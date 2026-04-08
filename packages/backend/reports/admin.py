"""Registro do modelo Report no Django Admin."""
from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Admin para Report."""

    list_display = ['number', 'name', 'category', 'status', 'last_generated']
    search_fields = ['name', 'name_jp']
    list_filter = ['status', 'category']
