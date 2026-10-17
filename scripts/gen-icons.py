import re,glob
names=set()
for f in glob.glob('src/app/**/*.ts',recursive=True):
    if f.endswith('icons.ts'): continue
    s=open(f).read()
    for m in re.finditer(r"""['"`]([a-z0-9]+(?:-[a-z0-9]+)*)['"`]""",s):
        names.add(m.group(1))
ex=set(re.findall(r'export declare var (\w+)',open('node_modules/ionicons/icons/index.d.ts').read()))
camel=lambda n:(lambda p:p[0]+''.join(x.capitalize() for x in p[1:]))(n.split('-'))
found=[(n,camel(n)) for n in sorted(names) if camel(n) in ex]
body=',\n  '.join(c for _,c in found)
open('src/app/icons.ts','w').write("import { addIcons } from 'ionicons';\nimport {\n  "+body+",\n} from 'ionicons/icons';\n\n/** Íconos usados en la app (registro único; funcionan sin conexión). Generado por scripts/gen-icons.py */\nexport function registerIcons(): void {\n  addIcons({\n  "+body+",\n  });\n}\n")
print(len(found))
