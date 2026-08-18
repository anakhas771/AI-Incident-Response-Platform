from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_hash_lifecycle_tokens"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="avatar",
            field=models.FileField(blank=True, null=True, upload_to="avatars/"),
        ),
    ]
