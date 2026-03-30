from django.core.management.base import BaseCommand

from calculator.data import PRODUCTS
from calculator.models import Product


class Command(BaseCommand):
    help = "Create or update the default PV Smart product catalog."

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for item in PRODUCTS:
            product, created = Product.objects.update_or_create(
                sku=item["sku"],
                defaults={
                    "name": item["name"],
                    "description": item["description"],
                    "price": item["price"],
                    "pv": item["pv"],
                    "highlight": item["highlight"],
                    "display_order": item["display_order"],
                    "is_active": True,
                },
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created {product.sku}"))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f"Updated {product.sku}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete. Created {created_count} product(s), updated {updated_count} product(s)."
            )
        )
