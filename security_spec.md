# Especificação de Segurança Firestore

## Invariantes de Dados
1. Cada documento de usuário deve ter um ID idêntico ao UID do Firebase Auth.
2. O campo `email` deve ser uma string válida e corresponder ao e-mail autenticado.
3. O campo `createdAt` é imutável após a criação.
4. O campo `uid` deve ser imutável e corresponder ao proprietário do documento.

## Dirty Dozen Payloads (Tentativas de Ataque)
1. **Uid Spoofing:** Tentar criar um perfil em `/users/outrouid` com meu próprio `uid`.
2. **Email Hijacking:** Tentar mudar o e-mail no Firestore para o e-mail de um admin sem mudar no Auth.
3. **Ghost Fields:** Tentar adicionar campos como `isAdmin: true` no perfil do usuário.
4. **Timestamp Manipulation:** Tentar definir um `createdAt` no passado ou futuro manualmente.
5. **Cross-User Read:** Tentar ler o perfil de outro usuário (`users/alguem`) estando logado.
6. **Cross-User Update:** Tentar atualizar o perfil de outro usuário.
7. **Identity Erasure:** Tentar deletar o próprio campo `uid` no update.
8. **Unauthenticated Write:** Tentar criar um usuário sem estar logado no Firebase Auth.
9. **Unauthenticated Read:** Tentar ler qualquer perfil sem estar logado.
10. **Shadow Key Injection:** Tentar injetar chaves desconhecidas em um update que deve ser restrito.
11. **Malicious ID:** Tentar criar um documento com um ID de 1MB de caracteres aleatórios.
12. **Status Skipping:** Tentar burlar verificações de estado (embora não tenhamos estados complexos aqui ainda).

## Plano de Testes
Os testes devem garantir `PERMISSION_DENIED` para todos os payloads acima.
