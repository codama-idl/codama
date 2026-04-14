import path from 'node:path';

import { getNodeCodec } from '@codama/dynamic-codecs';
import { type Address, getProgramDerivedAddress } from '@solana/addresses';
import { beforeEach, describe, expect, test } from 'vitest';

import { createProgramClient } from '../../../../src';
import type { BlogProgramClient } from '../../generated/blog-idl-types';
import { loadIdl, SvmTestContext } from '../../test-utils';

const idl = loadIdl('blog-idl.json');
const programClient = createProgramClient<BlogProgramClient>(idl);
const programSoPath = path.resolve(__dirname, '..', 'target', 'deploy', 'blog.so');

describe('blog', () => {
    let ctx: SvmTestContext;
    let payer: Address;

    beforeEach(async () => {
        ctx = new SvmTestContext({ defaultPrograms: true });
        ctx.loadProgram(programClient.programAddress, programSoPath);
        payer = await ctx.createFundedAccount();
    });

    describe('category PDA — string seed', () => {
        test('should create a category and read it back via pdas helper', async () => {
            const ix = await programClient.methods
                .createCategory({ name: 'solana' })
                .accounts({ creator: payer })
                .instruction();

            await ctx.sendInstruction(ix, [payer]);

            const [categoryPda] = await programClient.pdas.category({ name: 'solana' });
            const decoded = decodeAccount('category', categoryPda);
            expect(decoded.creator).toBe(payer);
            expect(decoded.name).toBe('solana');
        });

        test('should derive distinct PDAs for different category names', async () => {
            for (const name of ['tech', 'art', 'science']) {
                const ix = await programClient.methods
                    .createCategory({ name })
                    .accounts({ creator: payer })
                    .instruction();
                await ctx.sendInstruction(ix, [payer]);
            }

            const [techPda] = await programClient.pdas.category({ name: 'tech' });
            const [artPda] = await programClient.pdas.category({ name: 'art' });
            const [sciencePda] = await programClient.pdas.category({ name: 'science' });

            expect(decodeAccount('category', techPda).name).toBe('tech');
            expect(decodeAccount('category', artPda).name).toBe('art');
            expect(decodeAccount('category', sciencePda).name).toBe('science');
        });
    });

    describe('subscription PDA — two pubkey seeds', () => {
        test('should create a subscription and read it back via pdas helper', async () => {
            const author = payer;
            const follower = await ctx.createFundedAccount();

            const ix = await programClient.methods.subscribe().accounts({ author, follower }).instruction();

            await ctx.sendInstruction(ix, [follower]);

            const [subPda] = await programClient.pdas.subscription({ author, follower });
            const decoded = decodeAccount('subscription', subPda);
            expect(decoded.follower).toBe(follower);
            expect(decoded.author).toBe(author);
        });

        test('should derive distinct PDAs when follower/author are swapped', async () => {
            const alice = await ctx.createFundedAccount();
            const bob = await ctx.createFundedAccount();

            // Alice follows Bob
            const ix1 = await programClient.methods
                .subscribe()
                .accounts({ author: bob, follower: alice })
                .instruction();
            await ctx.sendInstruction(ix1, [alice]);

            // Bob follows Alice
            const ix2 = await programClient.methods
                .subscribe()
                .accounts({ author: alice, follower: bob })
                .instruction();
            await ctx.sendInstruction(ix2, [bob]);

            const [sub1] = await programClient.pdas.subscription({ author: bob, follower: alice });
            const [sub2] = await programClient.pdas.subscription({ author: alice, follower: bob });

            expect(decodeAccount('subscription', sub1).follower).toBe(alice);
            expect(decodeAccount('subscription', sub2).follower).toBe(bob);
        });
    });

    describe('post PDA — updatePost auto-derives post from postId argument', () => {
        test('should create a post then update it with auto-derived PDA', async () => {
            // Create profile
            const createProfileIx = await programClient.methods
                .createProfile({ username: 'writer' })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(createProfileIx, [payer]);

            const [profilePda] = await programClient.pdas.profile({ authority: payer });

            // Create post (manual PDA — Codama can't express profile.post_count dependency)
            const [postPda] = await programClient.pdas.post({ postId: 0, profile: profilePda });
            const createPostIx = await programClient.methods
                .createPost({ content: 'Original content', title: 'Original' })
                .accounts({ authority: payer, post: postPda })
                .instruction();
            await ctx.sendInstruction(createPostIx, [payer]);

            // Update post — post account should auto-derive from postId arg + profile account
            const updatePostIx = await programClient.methods
                .updatePost({ content: 'Updated content', postId: 0, title: 'Updated' })
                .accounts({ author: profilePda, authority: payer })
                .instruction();
            await ctx.sendInstruction(updatePostIx, [payer]);

            const decoded = decodeAccount('post', postPda);
            expect(decoded.title).toBe('Updated');
            expect(decoded.content).toBe('Updated content');
        });
    });

    describe('reaction PDA — two pubkeys + u8 seed', () => {
        test('should create a reaction and read it back via pdas helper', async () => {
            // Setup: create profile + post
            const createProfileIx = await programClient.methods
                .createProfile({ username: 'alice' })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(createProfileIx, [payer]);

            const [profilePda] = await programClient.pdas.profile({ authority: payer });
            const [postPda] = await programClient.pdas.post({ postId: 0, profile: profilePda });

            const createPostIx = await programClient.methods
                .createPost({ content: 'World', title: 'Hello' })
                .accounts({ authority: payer, post: postPda })
                .instruction();
            await ctx.sendInstruction(createPostIx, [payer]);

            // React with kind=1 (like)
            const reactor = await ctx.createFundedAccount();
            const ix = await programClient.methods
                .react({ kind: 1 })
                .accounts({ post: postPda, user: reactor })
                .instruction();
            await ctx.sendInstruction(ix, [reactor]);

            const [reactionPda] = await programClient.pdas.reaction({
                kind: 1,
                post: postPda,
                user: reactor,
            });
            const decoded = decodeAccount('reaction', reactionPda);
            expect(decoded.post).toBe(postPda);
            expect(decoded.user).toBe(reactor);
            expect(decoded.kind).toBe(1);
        });

        test('should derive distinct PDAs for different reaction kinds on the same post', async () => {
            // Setup: create profile + post
            const createProfileIx = await programClient.methods
                .createProfile({ username: 'bob' })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(createProfileIx, [payer]);

            const [profilePda] = await programClient.pdas.profile({ authority: payer });
            const [postPda] = await programClient.pdas.post({ postId: 0, profile: profilePda });

            const createPostIx = await programClient.methods
                .createPost({ content: 'There', title: 'Hi' })
                .accounts({ authority: payer, post: postPda })
                .instruction();
            await ctx.sendInstruction(createPostIx, [payer]);

            // Same user, two reaction kinds
            const reactor = await ctx.createFundedAccount();
            for (const kind of [0, 1]) {
                const ix = await programClient.methods
                    .react({ kind })
                    .accounts({ post: postPda, user: reactor })
                    .instruction();
                await ctx.sendInstruction(ix, [reactor]);
            }

            const [likePda] = await programClient.pdas.reaction({ kind: 0, post: postPda, user: reactor });
            const [lovePda] = await programClient.pdas.reaction({ kind: 1, post: postPda, user: reactor });

            expect(decodeAccount('reaction', likePda).kind).toBe(0);
            expect(decodeAccount('reaction', lovePda).kind).toBe(1);
        });
    });

    describe('dailyDigest PDA — pubkey + u16 + u8 + u8 seeds', () => {
        test('should create a daily digest and read it back via pdas helper', async () => {
            const createProfileIx = await programClient.methods
                .createProfile({ username: 'charlie' })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(createProfileIx, [payer]);

            const [profilePda] = await programClient.pdas.profile({ authority: payer });

            const ix = await programClient.methods
                .createDailyDigest({ day: 25, month: 2, year: 2026 })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(ix, [payer]);

            const [digestPda] = await programClient.pdas.dailyDigest({
                day: 25,
                month: 2,
                profile: profilePda,
                year: 2026,
            });
            const decoded = decodeAccount('dailyDigest', digestPda);
            expect(decoded.profile).toBe(profilePda);
            expect(decoded.year).toBe(2026);
            expect(decoded.month).toBe(2);
            expect(decoded.day).toBe(25);
            expect(decoded.postCount).toBe(0);
        });

        test('should derive distinct PDAs for different dates', async () => {
            const createProfileIx = await programClient.methods
                .createProfile({ username: 'dave' })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(createProfileIx, [payer]);

            const [profilePda] = await programClient.pdas.profile({ authority: payer });

            const dates = [
                { day: 1, month: 1, year: 2026 },
                { day: 2, month: 1, year: 2026 },
                { day: 1, month: 2, year: 2026 },
            ];

            for (const date of dates) {
                const ix = await programClient.methods
                    .createDailyDigest(date)
                    .accounts({ authority: payer })
                    .instruction();
                await ctx.sendInstruction(ix, [payer]);
            }

            for (const date of dates) {
                const [pda] = await programClient.pdas.dailyDigest({ profile: profilePda, ...date });
                const decoded = decodeAccount('dailyDigest', pda);
                expect(decoded.year).toBe(date.year);
                expect(decoded.month).toBe(date.month);
                expect(decoded.day).toBe(date.day);
            }
        });
    });

    describe('accessGrant PDA — pubkey + [u8; 4] array seed', () => {
        test('should create an access grant and read it back via pdas helper', async () => {
            const createProfileIx = await programClient.methods
                .createProfile({ username: 'eve' })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(createProfileIx, [payer]);

            const [profilePda] = await programClient.pdas.profile({ authority: payer });
            const permissions = new Uint8Array([1, 0, 1, 0]); // read, no-write, execute, no-admin

            const ix = await programClient.methods
                .createAccessGrant({ permissions })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(ix, [payer]);

            const [grantPda] = await programClient.pdas.accessGrant({
                permissions,
                profile: profilePda,
            });
            const decoded = decodeAccount('accessGrant', grantPda);
            expect(decoded.profile).toBe(profilePda);
            expect(decodeBytes(decoded.permissions)).toEqual([1, 0, 1, 0]);
        });

        test('should derive distinct PDAs for different permission sets', async () => {
            const createProfileIx = await programClient.methods
                .createProfile({ username: 'frank' })
                .accounts({ authority: payer })
                .instruction();
            await ctx.sendInstruction(createProfileIx, [payer]);

            const [profilePda] = await programClient.pdas.profile({ authority: payer });
            const readOnly = new Uint8Array([1, 0, 0, 0]);
            const fullAccess = new Uint8Array([1, 1, 1, 1]);

            for (const permissions of [readOnly, fullAccess]) {
                const ix = await programClient.methods
                    .createAccessGrant({ permissions })
                    .accounts({ authority: payer })
                    .instruction();
                await ctx.sendInstruction(ix, [payer]);
            }

            const [readPda] = await programClient.pdas.accessGrant({ permissions: readOnly, profile: profilePda });
            const [fullPda] = await programClient.pdas.accessGrant({ permissions: fullAccess, profile: profilePda });

            expect(decodeBytes(decodeAccount('accessGrant', readPda).permissions)).toEqual([1, 0, 0, 0]);
            expect(decodeBytes(decodeAccount('accessGrant', fullPda).permissions)).toEqual([1, 1, 1, 1]);
        });
    });

    describe('bookmarkList PDA — pubkey seed with Vec<Pubkey> arg', () => {
        test('should create a bookmark list with vec arg and read it back via pdas helper', async () => {
            const bookmark1 = await ctx.createAccount();
            const bookmark2 = await ctx.createAccount();
            const bookmark3 = await ctx.createAccount();

            const ix = await programClient.methods
                .createBookmarkList({ bookmarks: [bookmark1, bookmark2, bookmark3] })
                .accounts({ owner: payer })
                .instruction();
            await ctx.sendInstruction(ix, [payer]);

            const [listPda] = await programClient.pdas.bookmarkList({ owner: payer });
            const decoded = decodeAccount('bookmarkList', listPda);
            expect(decoded.owner).toBe(payer);
            expect(decoded.bookmarks).toEqual([bookmark1, bookmark2, bookmark3]);
        });

        test('should create a bookmark list with empty vec', async () => {
            const ix = await programClient.methods
                .createBookmarkList({ bookmarks: [] })
                .accounts({ owner: payer })
                .instruction();
            await ctx.sendInstruction(ix, [payer]);

            const [listPda] = await programClient.pdas.bookmarkList({ owner: payer });
            const decoded = decodeAccount('bookmarkList', listPda);
            expect(decoded.owner).toBe(payer);
            expect(decoded.bookmarks).toEqual([]);
        });
    });

    describe('category PDA — matches manual derivation with root program', () => {
        test('should derive PDA using root program address when no pdaNode.programId', async () => {
            const [categoryPda] = await programClient.pdas.category({ name: 'my-category' });

            const [expectedPda] = await getProgramDerivedAddress({
                programAddress: programClient.programAddress,
                seeds: ['category', 'my-category'],
            });
            expect(categoryPda).toBe(expectedPda);
        });
    });

    function decodeAccount(name: string, pda: Address) {
        const accountNode = programClient.root.program.accounts.find(a => a.name === name);
        if (!accountNode) throw new Error(`Account node "${name}" not found in IDL`);

        const codec = getNodeCodec([programClient.root, programClient.root.program, accountNode]);
        const data = ctx.requireEncodedAccount(pda).data;
        return codec.decode(Uint8Array.from(data)) as Record<string, unknown>;
    }

    /** Codama decodes fixedSize(bytes) as ['base64', encoded] — convert back to number[] */
    function decodeBytes(value: unknown): number[] {
        if (Array.isArray(value) && value[0] === 'base64' && typeof value[1] === 'string') {
            return [...Buffer.from(value[1], 'base64')];
        }
        throw new Error(`Expected ['base64', string], got: ${JSON.stringify(value)}`);
    }
});
