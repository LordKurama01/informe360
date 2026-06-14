insert into normatives (id, jurisdiction, type, number, year, title, topics, modules, status) values
('ley-19587','Nacional','Ley','19.587',1972,'Higiene y Seguridad en el Trabajo',array['Higiene y Seguridad','Trabajo'],array['hse','oil-gas'],'vigente'),
('dec-351-79','Nacional','Decreto','351/79',1979,'Reglamentario de la Ley 19.587',array['Condiciones de trabajo'],array['hse'],'vigente'),
('ley-24557','Nacional','Ley','24.557',1995,'Riesgos del Trabajo',array['ART','Riesgos del trabajo'],array['hse'],'vigente'),
('dec-911-96','Nacional','Decreto','911/96',1996,'Seguridad para la Industria de la Construcción',array['Construcción','Seguridad'],array['construction','hse'],'vigente'),
('srt-295-2003','Nacional','Resolución SRT','295/2003',2003,'Contaminantes, ergonomía, carga térmica, ruido y vibraciones',array['Ergonomía','Ruido','Contaminantes'],array['hse','oil-gas'],'vigente'),
('srt-299-2011','Nacional','Resolución SRT','299/2011',2011,'Entrega y certificación de EPP',array['EPP'],array['hse','oil-gas','construction'],'vigente'),
('srt-84-2012','Nacional','Resolución SRT','84/2012',2012,'Protocolo de medición de iluminación',array['Iluminación'],array['hse'],'vigente'),
('srt-85-2012','Nacional','Resolución SRT','85/2012',2012,'Protocolo de medición de ruido',array['Ruido'],array['hse'],'vigente'),
('srt-886-2015','Nacional','Resolución SRT','886/2015',2015,'Ergonomía y levantamiento manual de cargas',array['Ergonomía'],array['hse'],'vigente'),
('srt-900-2015','Nacional','Resolución SRT','900/2015',2015,'Puesta a tierra y continuidad eléctrica',array['Electricidad','PAT'],array['hse','maintenance'],'vigente'),
('neuquen-1875','Neuquén','Ley Provincial','1875',1990,'Medio Ambiente de la Provincia del Neuquén',array['Ambiente','Neuquén'],array['hse','oil-gas'],'vigente')
on conflict (id) do update set title = excluded.title, topics = excluded.topics, modules = excluded.modules, status = excluded.status;
