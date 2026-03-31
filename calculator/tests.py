from django.test import TestCase
from django.urls import reverse
from django.core.management import call_command
from django.contrib.auth import get_user_model
from io import StringIO
from unittest.mock import patch

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


class ProductAdminTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="password123",
        )
        self.client.force_login(self.user)
        call_command("seed_products")

    def test_admin_changelist_renders_custom_summary(self):
        response = self.client.get(reverse("admin:calculator_product_changelist"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "จัดการสินค้า ราคา และคะแนน PV")
        self.assertContains(response, "สินค้าทั้งหมด")


class EnsureSuperuserCommandTests(TestCase):
    def test_command_creates_superuser_from_env(self):
        out = StringIO()

        with patch.dict(
            "os.environ",
            {
                "DJANGO_SUPERUSER_USERNAME": "renderadmin",
                "DJANGO_SUPERUSER_EMAIL": "renderadmin@example.com",
                "DJANGO_SUPERUSER_PASSWORD": "StrongPassword123",
            },
            clear=False,
        ):
            call_command("ensure_superuser", stdout=out)

        User = get_user_model()
        self.assertTrue(User.objects.filter(username="renderadmin", is_superuser=True).exists())

# Create your tests here.
