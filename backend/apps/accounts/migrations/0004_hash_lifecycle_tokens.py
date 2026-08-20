from django.db import migrations


def hash_existing_tokens(apps, schema_editor):
    import hashlib

    for model_name in ("PasswordResetToken", "OrganizationInvitation"):
        model = apps.get_model("accounts", model_name)
        for obj in model.objects.all().iterator():
            obj.token = hashlib.sha256(obj.token.encode("utf-8")).hexdigest()
            obj.save(update_fields=["token"])


class Migration(migrations.Migration):
    dependencies = [("accounts", "0003_passwordresettoken_organizationinvitation")]
    operations = [migrations.RunPython(hash_existing_tokens, migrations.RunPython.noop)]
