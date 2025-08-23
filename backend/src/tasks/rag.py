from celery import shared_task

@shared_task
def stub(*args, **kwargs):
    """TODO: implement real logic."""
    return "stub"
