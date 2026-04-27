-- Categoriza despesas existentes pelo padrão de nome (mesma lógica de
-- src/lib/expense-icons.ts). Idempotente: só preenche linhas em que
-- category está null ou vazio. Não toca em quem já tem categoria.

UPDATE "expense_line" SET "category" = CASE
  WHEN "name" ~* 'cart[ãa]o'                                           THEN 'Cartão'
  WHEN "name" ~* '[áa]gua'                                             THEN 'Moradia'
  WHEN "name" ~* '\yluz\y|energia'                                     THEN 'Moradia'
  WHEN "name" ~* 'internet|fibra|vivo|fibralink'                       THEN 'Internet & Telefone'
  WHEN "name" ~* 'escola|col[ée]gio|ingl[êe]s|escote(iro|ira)'         THEN 'Educação'
  WHEN "name" ~* 'financ|imo[bv]el|aluguel|cond'                       THEN 'Moradia'
  WHEN "name" ~* 'terapia|psiqui|psic[óo]l'                            THEN 'Saúde'
  WHEN "name" ~* 'sa[úu]de|plano|dental|m[ée]dic|dermo|exame|consulta' THEN 'Saúde'
  WHEN "name" ~* 'carro|ipva|combust|posto|gasol|licenc|multa'         THEN 'Transporte'
  WHEN "name" ~* 'academia|ginast|nat[aã]'                             THEN 'Saúde'
  WHEN "name" ~* 'mei|pos\y|adv|virtus'                                THEN 'Trabalho'
  WHEN "name" ~* 'canto|m[uú]sica'                                     THEN 'Lazer'
  WHEN "name" ~* 'futebol|esporte'                                     THEN 'Lazer'
  WHEN "name" ~* 'iptu|imposto'                                        THEN 'Impostos'
  WHEN "name" ~* 'streaming|tv|netflix|spot'                           THEN 'Assinaturas'
  WHEN "name" ~* 'viagem|airbnb|hotel|passagem'                        THEN 'Viagem'
  WHEN "name" ~* 'telefone|celular|tim|claro'                          THEN 'Internet & Telefone'
  WHEN "name" ~* 'm[ãa]e|fam[íi]lia|filh|davi|isa|vivi|joel'           THEN 'Família'
  WHEN "name" ~* 'mercado|compras'                                     THEN 'Mercado'
  WHEN "name" ~* 'sal[áa]rio|pr[óo]-?labore|dividendo'                 THEN 'Receita'
END
WHERE ("category" IS NULL OR "category" = '')
  AND (
    "name" ~* 'cart[ãa]o' OR "name" ~* '[áa]gua' OR "name" ~* '\yluz\y|energia' OR
    "name" ~* 'internet|fibra|vivo|fibralink' OR
    "name" ~* 'escola|col[ée]gio|ingl[êe]s|escote(iro|ira)' OR
    "name" ~* 'financ|imo[bv]el|aluguel|cond' OR
    "name" ~* 'terapia|psiqui|psic[óo]l' OR
    "name" ~* 'sa[úu]de|plano|dental|m[ée]dic|dermo|exame|consulta' OR
    "name" ~* 'carro|ipva|combust|posto|gasol|licenc|multa' OR
    "name" ~* 'academia|ginast|nat[aã]' OR
    "name" ~* 'mei|pos\y|adv|virtus' OR
    "name" ~* 'canto|m[uú]sica' OR
    "name" ~* 'futebol|esporte' OR
    "name" ~* 'iptu|imposto' OR
    "name" ~* 'streaming|tv|netflix|spot' OR
    "name" ~* 'viagem|airbnb|hotel|passagem' OR
    "name" ~* 'telefone|celular|tim|claro' OR
    "name" ~* 'm[ãa]e|fam[íi]lia|filh|davi|isa|vivi|joel' OR
    "name" ~* 'mercado|compras' OR
    "name" ~* 'sal[áa]rio|pr[óo]-?labore|dividendo'
  );
