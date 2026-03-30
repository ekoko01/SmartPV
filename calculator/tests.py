from django.test import TestCase
from django.urls import reverse
from django.core.management import call_command

from .models import Product


class CalculatorPageTests(TestCase):
    def test_home_page_renders(self):
        response = self.client.get(reverse("calculator:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "ระบบช่วยคำนวณราคาและคะแนน PV อัตโนมัติ")

    def test_seed_products_command_populates_catalog(self):
        call_command("seed_products")

        self.assertEqual(Product.objects.count(), 8)
        self.assertTrue(Product.objects.filter(sku="CLD-01", name="คลอดต้า 1").exists())

# Create your tests here.
