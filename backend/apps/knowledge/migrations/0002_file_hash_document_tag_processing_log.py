# Generated migration for production hardening sprint
# Adds: file_hash to KnowledgeDocument, DocumentTag model, DocumentProcessingLog model

import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("knowledge", "0001_initial"),
    ]

    operations = [
        # --- T1: file_hash field on KnowledgeDocument ---
        migrations.AddField(
            model_name="knowledgedocument",
            name="file_hash",
            field=models.CharField(
                blank=True,
                db_index=True,
                default="",
                help_text="SHA-256 hash of the uploaded file for duplicate detection.",
                max_length=64,
            ),
            preserve_default=False,
        ),
        migrations.AddConstraint(
            model_name="knowledgedocument",
            constraint=models.UniqueConstraint(
                condition=models.Q(file_hash__gt=""),
                fields=["organization", "file_hash"],
                name="unique_document_hash_per_org",
            ),
        ),
        # --- T4: DocumentTag model ---
        migrations.CreateModel(
            name="DocumentTag",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(db_index=True, max_length=50)),
                (
                    "document",
                    models.ForeignKey(
                        db_index=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tags",
                        to="knowledge.knowledgedocument",
                    ),
                ),
            ],
            options={
                "verbose_name": "Document Tag",
                "verbose_name_plural": "Document Tags",
                "ordering": ["name"],
            },
        ),
        migrations.AlterUniqueTogether(
            name="documenttag",
            unique_together={("document", "name")},
        ),
        # --- T8: DocumentProcessingLog model ---
        migrations.CreateModel(
            name="DocumentProcessingLog",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "stage",
                    models.CharField(
                        choices=[
                            ("UPLOAD", "Upload"),
                            ("PARSING", "Parsing"),
                            ("CHUNKING", "Chunking"),
                            ("EMBEDDING", "Embedding"),
                            ("INDEXING", "Indexing"),
                            ("FAILED", "Failed"),
                        ],
                        db_index=True,
                        max_length=20,
                    ),
                ),
                ("message", models.TextField(blank=True, default="")),
                (
                    "document",
                    models.ForeignKey(
                        db_index=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="processing_logs",
                        to="knowledge.knowledgedocument",
                    ),
                ),
            ],
            options={
                "verbose_name": "Document Processing Log",
                "verbose_name_plural": "Document Processing Logs",
                "ordering": ["created_at"],
            },
        ),
    ]
