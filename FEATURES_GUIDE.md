# PebloNote New Features - Quick Reference

## What's New in PebloNote

### 1. Tags & Categories
Organize and filter your notes with custom tags.

**How to use:**
- Click "Add tags" when creating/editing a note
- Type tag names (comma-separated)
- Filter by tags in the sidebar
- View top tags on the dashboard

**API:**
- `GET /api/tags` - Get all your tags
- `POST /api/tags/:roomId/set` - Set tags on a note

---

### 2. Archive Notes
Keep your workspace clean by archiving old notes.

**How to use:**
- Click archive icon on any note
- Toggle "Show archived" in sidebar to view archived notes
- Unarchive notes anytime

**API:**
- `PATCH /api/room-advanced/:roomId/archive` - Toggle archive state

---

### 3. Public Share Links
Share your notes with anyone, even without an account.

**How to use:**
- Click share icon on a note
- Copy the generated link
- Share link with others
- Viewers can see the note at `yourdomain.com/shared/[link]`

**API:**
- `PATCH /api/room-advanced/:roomId/share` - Generate share link
- `GET /api/room-advanced/shared/:shareId` - View shared note (public)

---

### 4. AI Action Items
Automatically extract action items from your notes.

**How to use:**
- Open a note
- Click "Extract" in AI sidebar
- PebloNote extracts action items from content
- Check off items as you complete them

**API:**
- `POST /api/room-advanced/:roomId/ai/action-items`

---

### 5. AI Title Suggestions
Get smart title suggestions based on note content.

**How to use:**
- Open a note
- Click "Suggest" in AI sidebar
- Review suggestion
- Click "Apply" to use it

**API:**
- `POST /api/room-advanced/:roomId/ai/title`

---

### 6. Smart Search & Filtering
Find notes quickly with powerful search and filters.

**How to use:**
- Type in search box (searches titles and content)
- Click tag pills to filter by tags
- Click "Last edited" or "Created" to change sort
- Toggle "Show archived" to view archived notes

**API:**
- `GET /api/room-advanced/search/rooms?search=query&tags=work,meeting&archived=false&sort=updated`

---

### 7. Productivity Dashboard
Get insights into your note-taking and AI usage.

**Dashboard shows:**
- Total active and archived notes
- Weekly activity chart (edits per day)
- Top tags you use
- AI usage statistics
- Recent notes

**API:**
- `GET /api/dashboard/insights`

---

### 8. Auto-Save Indicator
Visual feedback when your changes are being saved.

**Status indicators:**
- 💾 "All changes saved" - Everything is saved
- ⏳ "Saving..." - Saving in progress
- ✅ "Saved" - Just saved
- ❌ "Save failed" - Error saving (will retry)

---

### 9. Input Validation
All inputs are validated for security and consistency.

**Validated:**
- Email format
- Password strength (min 8 chars)
- User name (2-100 chars)
- Tag names (non-empty, unique per user)

---

### 10. Rate Limiting
AI endpoints are rate-limited to 10 calls per minute per user.

---

## Database Changes

New tables:
- `Tag` - User-defined categories
- `NoteTag` - Links notes to tags (many-to-many)
- `AIOutput` - Stores all AI operation results
- `RefreshToken` - Session tokens

Updated tables:
- `Room` - Added: isArchived, isPublic, shareId
- `User` - Added: relationships to tags, aiOutputs, refreshTokens

---

## Frontend Components Added

1. **TagInput.tsx** - Input field for tags with autocomplete
2. **NotesSearch.tsx** - Search and filter UI
3. **SaveIndicator.tsx** - Shows save status
4. **AISidebar.tsx** - AI action items and title suggestion panels
5. **StatsGrid.tsx** - Dashboard statistics display

---

## Hooks Added

1. **useAutoSave.ts** - Auto-save with debounce
2. **useDebounce.ts** - Generic debounce hook

---

## Migration Steps

To add these features to an existing PebloNote installation:

```bash
# 1. Update Prisma schema
# Copy new models from schema.prisma

# 2. Create migration
cd packages/db
npx prisma migrate dev --name add-peblo-features

# 3. Update backend files
# - Copy new controllers: tagsController.ts, advancedRoomController.ts
# - Copy new routes: tagsRoutes.ts, roomAdvancedRoutes.ts
# - Update index.ts to register routes
# - Copy validators.ts

# 4. Copy frontend components and hooks to apps/web

# 5. Update .env files with new variables

# 6. Restart services
pnpm dev
```

---

## API Examples

### Create tags on a note
```bash
POST /api/tags/1/set
Content-Type: application/json

{
  "tags": ["work", "meeting", "urgent"]
}
```

### Search notes
```bash
GET /api/room-advanced/search/rooms?search=project&tags=work&archived=false&sort=updated
```

### Get dashboard insights
```bash
GET /api/dashboard/insights
```

### Extract action items
```bash
POST /api/room-advanced/1/ai/action-items
```

### Generate share link
```bash
PATCH /api/room-advanced/1/share
```

---

## Performance Notes

- Tags are cached with counts per query
- Search supports index lookups (title, content)
- AI outputs cached to avoid duplicate processing
- Dashboard aggregations optimized with database grouping
- Weekly activity calculated efficiently with date ranges

---

## Security

- All endpoints require authentication (except `/shared/:shareId`)
- Tags are user-specific (name_userId unique constraint)
- Public sharing generates random UUIDs
- Rate limiting prevents AI abuse
- Input validation on all endpoints
- SQL injection prevented via Prisma ORM

---

## Known Limitations

- Shared notes are read-only (no authentication required)
- AI operations are rate-limited to 10/minute
- Search is case-insensitive
- Tags are unique per user per name (can't have duplicate tag names)

---

## Future Enhancements

- [ ] Collaborative tags (team-wide categories)
- [ ] Tag hierarchy/organization
- [ ] Advanced analytics (heat maps, usage trends)
- [ ] Scheduled exports
- [ ] AI cost tracking and limits per user
- [ ] OAuth login
- [ ] Mobile app
- [ ] Offline support

---

For more details, see:
- `SETUP_GUIDE.md` - Deployment guide
- `IMPLEMENTATION_CHECKLIST.md` - Feature checklist
- `samples/api-responses.json` - API examples
