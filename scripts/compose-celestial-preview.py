from pathlib import Path
import sys
from PIL import Image

root = Path(sys.argv[1])
frames = [Image.open(p).convert('RGB') for p in sorted((root / 'celestial-cast-frames').glob('frame-*.png'))]
frames[0].save(root / 'all-celestial-casts.gif', save_all=True, append_images=frames[1:], duration=40, loop=0, disposal=2)
pairs = []
for frame in frames:
    pair = Image.new('RGB', (720, 400), '#0b1320')
    pair.paste(frame.crop((720, 0, 1080, 400)), (0, 0))
    pair.paste(frame.crop((720, 400, 1080, 800)), (360, 0))
    pairs.append(pair)
pairs[0].save(root / 'jupiter-neptune-casts.gif', save_all=True, append_images=pairs[1:], duration=40, loop=0, disposal=2)
print('Saved animated celestial cast gallery.')
