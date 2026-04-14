#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("1rAs9KgDjEnMVrU1nJPWVhN4b6W4VEBxzcNJoeJpbVR");

#[program]
pub mod blog {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>, username: String) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.authority = ctx.accounts.authority.key();
        profile.username = username;
        profile.post_count = 0;
        profile.bump = ctx.bumps.profile;
        Ok(())
    }

    pub fn create_post(
        ctx: Context<CreatePost>,
        title: String,
        content: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let post = &mut ctx.accounts.post;

        post.author = profile.key();
        post.id = profile.post_count;
        post.title = title;
        post.content = content;
        post.bump = ctx.bumps.post;

        profile.post_count += 1;
        Ok(())
    }

    pub fn update_post(
        ctx: Context<UpdatePost>,
        _post_id: u64,
        title: String,
        content: String,
    ) -> Result<()> {
        let post = &mut ctx.accounts.post;
        post.title = title;
        post.content = content;
        Ok(())
    }

    pub fn create_category(ctx: Context<CreateCategory>, name: String) -> Result<()> {
        let category = &mut ctx.accounts.category;
        category.creator = ctx.accounts.creator.key();
        category.name = name;
        category.bump = ctx.bumps.category;
        Ok(())
    }

    pub fn subscribe(ctx: Context<Subscribe>) -> Result<()> {
        let subscription = &mut ctx.accounts.subscription;
        subscription.follower = ctx.accounts.follower.key();
        subscription.author = ctx.accounts.author.key();
        subscription.bump = ctx.bumps.subscription;
        Ok(())
    }

    pub fn react(ctx: Context<React>, kind: u8) -> Result<()> {
        let reaction = &mut ctx.accounts.reaction;
        reaction.post = ctx.accounts.post.key();
        reaction.user = ctx.accounts.user.key();
        reaction.kind = kind;
        reaction.bump = ctx.bumps.reaction;
        Ok(())
    }

    pub fn create_daily_digest(
        ctx: Context<CreateDailyDigest>,
        year: u16,
        month: u8,
        day: u8,
    ) -> Result<()> {
        let digest = &mut ctx.accounts.daily_digest;
        digest.profile = ctx.accounts.profile.key();
        digest.year = year;
        digest.month = month;
        digest.day = day;
        digest.post_count = 0;
        digest.bump = ctx.bumps.daily_digest;
        Ok(())
    }

    pub fn create_access_grant(
        ctx: Context<CreateAccessGrant>,
        permissions: [u8; 4],
    ) -> Result<()> {
        let grant = &mut ctx.accounts.access_grant;
        grant.profile = ctx.accounts.profile.key();
        grant.permissions = permissions;
        grant.bump = ctx.bumps.access_grant;
        Ok(())
    }

    pub fn create_bookmark_list(
        ctx: Context<CreateBookmarkList>,
        bookmarks: Vec<Pubkey>,
    ) -> Result<()> {
        let list = &mut ctx.accounts.bookmark_list;
        list.owner = ctx.accounts.owner.key();
        list.bookmarks = bookmarks;
        list.bump = ctx.bumps.bookmark_list;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateProfile<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Profile::INIT_SPACE,
        seeds = [b"profile", authority.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, Profile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String, content: String)]
pub struct CreatePost<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority,
    )]
    pub profile: Account<'info, Profile>,
    #[account(
        init,
        payer = authority,
        space = 8 + Post::INIT_SPACE,
        seeds = [b"post", profile.key().as_ref(), &profile.post_count.to_le_bytes()],
        bump
    )]
    pub post: Account<'info, Post>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(post_id: u64)]
pub struct UpdatePost<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority,
    )]
    pub profile: Account<'info, Profile>,
    #[account(
        mut,
        seeds = [b"post", profile.key().as_ref(), &post_id.to_le_bytes()],
        bump = post.bump,
        has_one = author,
    )]
    pub post: Account<'info, Post>,
    /// CHECK: validated via has_one on post
    pub author: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateCategory<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + Category::INIT_SPACE,
        seeds = [b"category", name.as_bytes()],
        bump
    )]
    pub category: Account<'info, Category>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub follower: Signer<'info>,
    /// CHECK: the author profile being followed
    pub author: UncheckedAccount<'info>,
    #[account(
        init,
        payer = follower,
        space = 8 + Subscription::INIT_SPACE,
        seeds = [b"sub", follower.key().as_ref(), author.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(kind: u8)]
pub struct React<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: the post being reacted to
    pub post: UncheckedAccount<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + Reaction::INIT_SPACE,
        seeds = [b"reaction", post.key().as_ref(), user.key().as_ref(), &kind.to_le_bytes()],
        bump
    )]
    pub reaction: Account<'info, Reaction>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(year: u16, month: u8, day: u8)]
pub struct CreateDailyDigest<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority,
    )]
    pub profile: Account<'info, Profile>,
    #[account(
        init,
        payer = authority,
        space = 8 + DailyDigest::INIT_SPACE,
        seeds = [b"digest", profile.key().as_ref(), &year.to_le_bytes(), &month.to_le_bytes(), &day.to_le_bytes()],
        bump
    )]
    pub daily_digest: Account<'info, DailyDigest>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Profile {
    pub authority: Pubkey,
    #[max_len(32)]
    pub username: String,
    pub post_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Post {
    pub author: Pubkey,
    pub id: u64,
    #[max_len(64)]
    pub title: String,
    #[max_len(512)]
    pub content: String,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Category {
    pub creator: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Subscription {
    pub follower: Pubkey,
    pub author: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Reaction {
    pub post: Pubkey,
    pub user: Pubkey,
    pub kind: u8,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(permissions: [u8; 4])]
pub struct CreateAccessGrant<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority,
    )]
    pub profile: Account<'info, Profile>,
    #[account(
        init,
        payer = authority,
        space = 8 + AccessGrant::INIT_SPACE,
        seeds = [b"grant", profile.key().as_ref(), permissions.as_ref()],
        bump
    )]
    pub access_grant: Account<'info, AccessGrant>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bookmarks: Vec<Pubkey>)]
pub struct CreateBookmarkList<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + BookmarkList::INIT_SPACE,
        seeds = [b"bookmarks", owner.key().as_ref()],
        bump
    )]
    pub bookmark_list: Account<'info, BookmarkList>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct DailyDigest {
    pub profile: Pubkey,
    pub year: u16,
    pub month: u8,
    pub day: u8,
    pub post_count: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AccessGrant {
    pub profile: Pubkey,
    pub permissions: [u8; 4],
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BookmarkList {
    pub owner: Pubkey,
    #[max_len(10)]
    pub bookmarks: Vec<Pubkey>,
    pub bump: u8,
}
