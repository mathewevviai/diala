from celery import Celery

celery_app = Celery(
    "diala",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
    include=[
        "tasks.agent",
        "tasks.hunter",
        "tasks.rag",
        "tasks.swarm",
        "tasks.transcribe",
        "tasks.voice",
    ],
)

celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    result_expires=86400,
)
