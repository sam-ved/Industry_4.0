from celery import Celery

app = Celery('industry40')
app.config_from_object('backend.config.celery_config')
app.autodiscover_tasks(['backend.jobs'])
