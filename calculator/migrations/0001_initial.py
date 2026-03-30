from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sku", models.CharField(max_length=32, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("pv", models.DecimalField(decimal_places=2, max_digits=10)),
                ("highlight", models.CharField(blank=True, max_length=64)),
                ("is_active", models.BooleanField(default=True)),
                ("display_order", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ["display_order", "name"]},
        ),
    ]
