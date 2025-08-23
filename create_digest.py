import os

files = [
    'frontend/convex/schema.ts',
    'frontend/convex/telephonyActions.ts', 
    'frontend/convex/mutations/telephony.ts',
    'frontend/convex/queries/telephony.ts',
    'backend/src/services/telephony_service.py',
    'backend/src/services/gstreamer_service.py',
    'backend/src/api/telephony_api.py',
    'frontend/src/app/onboarding/rtc/page.tsx'
]

print('Creating telephony_gitingest.txt with all modified files...')
with open('telephony_gitingest.txt', 'w') as f:
    f.write('# Telephony Integration Files\n\n')
    for file_path in files:
        full_path = os.path.join(os.getcwd(), file_path)
        if os.path.exists(full_path):
            f.write(f'## {file_path}\n```\n')
            with open(full_path, 'r') as src:
                content = src.read()
                f.write(content)
            f.write('\n```\n\n')
        else:
            f.write(f'## {file_path} (NOT FOUND)\n\n')
print('Created: telephony_gitingest.txt')
