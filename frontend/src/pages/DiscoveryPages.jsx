import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { api, resolvePhotoUrl } from "../services/api.js";
import { useRemote } from "../hooks/useRemote.js";
import { Avatar, Button, ConfirmDialog, EmptyState, ErrorNotice, Icon, PageHeading, PageSpinner } from "../components/ui.jsx";

function displayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function ProfileCard({ person, onOpen, onLike, onPass, pending }) {
  const photo = resolvePhotoUrl(person.profilePhoto || person.photos?.[0]);
  return (
    <article className="profile-card">
      <button type="button" className="profile-card-photo" onClick={onOpen} aria-label={`View ${person.name}'s profile`}>
        {photo ? <img src={photo} alt={person.name} loading="lazy" /> : <div className="profile-photo-fallback"><Avatar person={person} size="xl" /></div>}
        {person.distance && <span className="distance-pill"><Icon name="mapPin" size={12} />{person.distance}</span>}
        {person.isVerified && <span className="verified-pill"><Icon name="checkCircle" size={13} /> Verified</span>}
        <span className="photo-count"><Icon name="image" size={13} />{person.photos?.length || (photo ? 1 : 0)}</span>
      </button>
      <div className="profile-card-body">
        <div className="profile-name-line"><button type="button" onClick={onOpen}><strong>{person.name}{person.age ? `, ${person.age}` : ""}</strong></button>{person.compatibilityScore && <span className="compatibility"><Icon name="heart" size={12} />{person.compatibilityScore}%</span>}</div>
        <p className="profile-location">{person.city || "Location not shared"}</p>
        {person.bio && <p className="profile-bio">{person.bio}</p>}
        <div className="interest-row">{(person.mutualInterests?.length ? person.mutualInterests : person.interests || []).slice(0, 3).map((interest) => <span className="interest-pill" key={interest}>{interest}</span>)}</div>
        <div className="profile-card-actions"><button className="round-action pass-action" type="button" disabled={pending} onClick={onPass} aria-label={`Pass on ${person.name}`}><Icon name="x" size={19} /></button><button className="round-action like-action" type="button" disabled={pending} onClick={() => onLike("like")} aria-label={`Like ${person.name}`}><Icon name="heart" size={20} /></button><button className="round-action spark-action" type="button" disabled={pending} onClick={() => onLike("superlike")} aria-label={`Send ${person.name} a super-like`}><Icon name="star" size={18} /></button></div>
      </div>
    </article>
  );
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [pendingId, setPendingId] = useState("");
  const [gender, setGender] = useState(searchParams.get("gender") || "all");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verifiedOnly") === "true");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setGender(searchParams.get("gender") || "all");
    setVerifiedOnly(searchParams.get("verifiedOnly") === "true");
  }, [searchParams]);

  const query = { search: debouncedSearch, gender, verifiedOnly };
  const requestKey = JSON.stringify(query);
  const fetchProfiles = async () => {
    const params = {};
    if (query.search) params.search = query.search;
    if (query.gender !== "all") params.gender = query.gender;
    if (query.verifiedOnly) params.verifiedOnly = "true";
    params.limit = 40;
    const { data } = await api.get("/profiles", { params });
      return data.profiles || [];
  };
  const { data: profiles, loading, error, reload } = useRemote(fetchProfiles, requestKey);

  async function actOnProfile(person, type) {
    const id = person.id || person._id;
    setPendingId(String(id));
    try {
      if (type === "pass") {
        await api.post(`/likes/${encodeURIComponent(id)}/pass`);
        toast("Profile passed");
      } else {
        const { data } = await api.post(`/likes/${encodeURIComponent(id)}`, { type });
        toast.success(data.matchId || data.isMatch ? `It’s a match with ${person.name}!` : type === "superlike" ? `Super-like sent to ${person.name}` : `You liked ${person.name}`);
      }
      await reload();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "We could not save that action.");
    } finally {
      setPendingId("");
    }
  }

  function updateQuery(next) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => value && value !== "all" ? params.set(key, String(value)) : params.delete(key));
    setSearchParams(params, { replace: true });
  }

  return <div className="page-content discover-page"><PageHeading eyebrow="A GOOD PLACE TO START" title="Discover people" description="Take a look around. The best conversations often start with one shared detail." action={<Button to="/search" variant="soft"><Icon name="sliders" size={16} /> Search filters</Button>} />
    <div className="discover-toolbar"><label className="member-search"><Icon name="search" size={17} /><input type="search" aria-label="Search profiles" placeholder="Try a name, interest, or place" value={search} onChange={(event) => { setSearch(event.target.value); updateQuery({ search: event.target.value }); }} /><kbd>⌘ K</kbd></label><div className="discover-quick-filters"><label><span>Show</span><select aria-label="Filter profiles by gender" value={gender} onChange={(event) => { setGender(event.target.value); updateQuery({ gender: event.target.value }); }}><option value="all">Everyone</option><option value="female">Women</option><option value="male">Men</option><option value="non-binary">Non-binary</option><option value="other">Other</option></select></label><label className="verified-toggle"><input type="checkbox" checked={verifiedOnly} onChange={(event) => { setVerifiedOnly(event.target.checked); updateQuery({ verifiedOnly: event.target.checked ? "true" : "" }); }} /> Verified only</label></div></div>
    <div className="results-meta"><span>{loading ? "Finding profiles…" : `${profiles?.length || 0} profiles to explore`}</span><span><Icon name="shield" size={14} /> Real profiles. Mutual interest.</span></div>
    {error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}
    {loading && !profiles ? <div className="profile-grid skeleton-grid">{Array.from({ length: 4 }, (_, index) => <div className="profile-skeleton" key={index} />)}</div> : profiles?.length ? <div className="profile-grid">{profiles.map((person) => <ProfileCard key={person.id || person._id} person={person} pending={pendingId === String(person.id || person._id)} onOpen={() => navigate(`/profile/${person.id || person._id}`)} onLike={(type) => actOnProfile(person, type)} onPass={() => actOnProfile(person, "pass")} />)}</div> : !error && <EmptyState icon="compass" title="You’ve seen everyone for now" text="Try widening your filters or check back later as more people join HeartLink." action={<Button to="/search" variant="soft">Adjust filters <Icon name="arrowRight" size={15} /></Button>} />}
    {profiles?.length > 0 && <div className="list-end-note"><Icon name="heart" size={14} /> Take your time. A good connection doesn’t need to be rushed.</div>}
  </div>;
}

function ReportDialog({ person, onClose }) {
  const [reason, setReason] = useState("inappropriate_content");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!person) return null;
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await api.post("/reports", { reportedUserId: person.id || person._id, reason, details });
      toast.success("Your report has been sent to the safety team.");
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not submit the report.");
    } finally { setBusy(false); }
  }
  return <div className="modal-backdrop"><section className="confirm-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title"><button className="modal-close" type="button" onClick={onClose} aria-label="Close"><Icon name="x" /></button><span className="confirm-icon destructive"><Icon name="shield" size={22} /></span><h2 id="report-title">Report this profile</h2><p>Reports are reviewed by the HeartLink safety team.</p><form onSubmit={submit}><label className="field"><span>What happened?</span><select value={reason} onChange={(event) => setReason(event.target.value)}><option value="inappropriate_photos">Inappropriate photos</option><option value="inappropriate_content">Inappropriate content</option><option value="harassment">Harassment</option><option value="fake_profile">Fake profile</option><option value="spam_or_scam">Spam or scam</option><option value="underage">Underage concern</option><option value="other">Other</option></select></label><label className="field"><span>Details (optional)</span><textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={500} rows={4} placeholder="Share any details that could help us review this…" /></label>{error && <p className="field-error" role="alert">{error}</p>}<div className="confirm-actions"><Button variant="soft" onClick={onClose}>Cancel</Button><Button type="submit" variant="danger" disabled={busy}>{busy ? "Sending…" : "Send report"}</Button></div></form></section></div>;
}

export function ProfilePage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useRemote(async () => {
    const { data: result } = await api.get(`/profiles/${encodeURIComponent(profileId)}`);
    return result.profile || result.user;
  }, profileId);

  async function like(type = "like") {
    if (!data) return;
    setBusy(true);
    try {
      const { data: result } = await api.post(`/likes/${encodeURIComponent(data.id || data._id)}`, { type });
      toast.success(result.matchId || result.isMatch ? `It’s a match with ${data.name}!` : type === "superlike" ? `Super-like sent to ${data.name}` : `You liked ${data.name}`);
      if (result.matchId) navigate(`/messages/${result.matchId}`);
    } catch (requestError) { toast.error(requestError.response?.data?.message || "We could not send that like."); }
    finally { setBusy(false); }
  }

  async function block() {
    setBusy(true);
    try {
      await api.post(`/blocks/${encodeURIComponent(data.id || data._id)}`);
      toast.success(`${data.name} has been blocked.`);
      navigate("/discover", { replace: true });
    } catch (requestError) { toast.error(requestError.response?.data?.message || "We could not block this member."); }
    finally { setBusy(false); setConfirmBlock(false); }
  }

  if (loading && !data) return <div className="page-content"><PageSpinner label="Opening profile" /></div>;
  if (error && !data) return <div className="page-content"><ErrorNotice onRetry={reload}>{error}</ErrorNotice></div>;
  if (!data) return <div className="page-content"><EmptyState icon="user" title="Profile unavailable" text="This profile may have been removed or is no longer visible." action={<Button to="/discover" variant="soft">Back to discover</Button>} /></div>;
  const photos = data.photos?.length ? data.photos : [data.profilePhoto].filter(Boolean);
  return <div className="page-content profile-detail-page"><div className="profile-back-row"><Button variant="quiet" onClick={() => navigate(-1)}><Icon name="arrowLeft" size={16} /> Back</Button><button className="profile-more" type="button" aria-label="Safety actions" onClick={() => setReportOpen(true)}><Icon name="more" /></button></div><article className="profile-detail-card"><div className="detail-gallery"><div className="detail-gallery-main">{photos[0] ? <img src={resolvePhotoUrl(photos[0])} alt={`${data.name}'s profile`} /> : <div className="profile-photo-fallback"><Avatar person={data} size="xl" /></div>}<span className="gallery-count"><Icon name="image" size={14} />{photos.length} {photos.length === 1 ? "photo" : "photos"}</span></div>{photos.length > 1 && <div className="detail-gallery-side">{photos.slice(1, 3).map((photo, index) => <img key={`${photo}-${index}`} src={resolvePhotoUrl(photo)} alt={`${data.name} photo ${index + 2}`} />)}</div>}</div><div className="profile-detail-body"><div className="detail-intro"><div><span className="eyebrow">A LITTLE ABOUT {data.name?.split(" ")[0]?.toUpperCase()}</span><h1>{data.name}{data.age ? `, ${data.age}` : ""}{data.isVerified && <span className="verified-check" title="Verified profile"><Icon name="checkCircle" size={20} /></span>}</h1><p><Icon name="mapPin" size={15} /> {data.city || "Location not shared"}{data.distance ? ` · ${data.distance}` : ""}</p></div><span className="intent-pill">Looking for {data.lookingFor || "a connection"}</span></div>{data.bio && <section className="detail-section"><h2>A little about me</h2><p className="profile-bio-full">{data.bio}</p></section>}{data.interests?.length > 0 && <section className="detail-section"><h2>Things I enjoy</h2><div className="detail-interests">{data.interests.map((interest) => <span className="interest-pill" key={interest}>{interest}</span>)}</div></section>}{data.prompts?.length > 0 && <section className="detail-section"><h2>Conversation starters</h2><div className="prompt-grid">{data.prompts.map((prompt, index) => <article className="prompt-card" key={`${prompt.question}-${index}`}><small>{prompt.question}</small><p>{prompt.answer}</p></article>)}</div></section>}{data.lifestyle && Object.entries(data.lifestyle).filter(([, value]) => value).length > 0 && <section className="detail-section"><h2>More about me</h2><div className="lifestyle-grid">{Object.entries(data.lifestyle).filter(([, value]) => value).map(([key, value]) => <div key={key}><small>{key.replace(/([A-Z])/g, " $1")}</small><strong>{String(value)}</strong></div>)}</div></section>}<div className="detail-actions"><Button disabled={busy} onClick={() => like("like")}><Icon name="heart" size={17} /> Like {data.name?.split(" ")[0]}</Button><Button variant="soft" disabled={busy} onClick={() => like("superlike")}><Icon name="star" size={16} /> Super-like</Button><button className="text-action" type="button" onClick={() => setReportOpen(true)}><Icon name="shield" size={15} /> Report</button><button className="text-action danger-text" type="button" onClick={() => setConfirmBlock(true)}><Icon name="x" size={15} /> Block</button></div></div></article><ReportDialog person={reportOpen ? data : null} onClose={() => setReportOpen(false)} /><ConfirmDialog open={confirmBlock} title={`Block ${data.name}?`} description="They won’t appear in discovery or be able to contact you. This also ends any active match between you." confirmLabel="Block member" destructive busy={busy} onConfirm={block} onCancel={() => setConfirmBlock(false)} /></div>;
}

export function LikesPage() {
  const [tab, setTab] = useState("received");
  const navigate = useNavigate();
  const fetchLikes = async () => {
    const { data } = await api.get(`/likes/${tab}`);
    return data.likes || [];
  };
  const { data: likes, loading, error, reload } = useRemote(fetchLikes, tab);
  const [pending, setPending] = useState("");

  useEffect(() => {
    const handleLikesChanged = () => {
      if (tab === "received") {
        reload({ silent: true });
      }
    };
    window.addEventListener("heartlink:likes_changed", handleLikesChanged);
    return () => window.removeEventListener("heartlink:likes_changed", handleLikesChanged);
  }, [tab, reload]);
  async function respond(person) {
    const id = person.id || person._id;
    setPending(String(id));
    try {
      const { data } = await api.post(`/likes/${encodeURIComponent(id)}`, { type: "like" });
      toast.success(data.matchId || data.isMatch ? `It’s a match with ${person.name}!` : `You liked ${person.name} back`);
      await reload();
      if (data.matchId) navigate(`/messages/${data.matchId}`);
    } catch (requestError) { toast.error(requestError.response?.data?.message || "We could not return that like."); }
    finally { setPending(""); }
  }
  async function remove(person) {
    const id = person.id || person._id;
    setPending(String(id));
    try { await api.delete(`/likes/${encodeURIComponent(id)}`); toast.success("Like removed"); await reload(); }
    catch (requestError) { toast.error(requestError.response?.data?.message || "We could not remove that like."); }
    finally { setPending(""); }
  }
  return <div className="page-content likes-page"><PageHeading eyebrow="A LITTLE INTEREST GOES A LONG WAY" title="Likes" description="See who’s shown interest, and choose what feels right for you." /><div className="tabs-row" role="tablist" aria-label="Like list"><button type="button" role="tab" aria-selected={tab === "received"} className={tab === "received" ? "active" : ""} onClick={() => setTab("received")}>Received</button><button type="button" role="tab" aria-selected={tab === "sent"} className={tab === "sent" ? "active" : ""} onClick={() => setTab("sent")}>Sent</button></div>{error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}{loading && !likes ? <PageSpinner label="Checking your likes" /> : likes?.length ? <div className="likes-grid">{likes.map((person) => <article className="like-card" key={person.id || person._id}><button className="like-photo" type="button" onClick={() => navigate(`/profile/${person.id || person._id}`)}>{person.profilePhoto ? <img src={resolvePhotoUrl(person.profilePhoto)} alt={person.name} loading="lazy" /> : <div className="profile-photo-fallback"><Avatar person={person} size="xl" /></div>}<span className={`like-type ${person.type === "superlike" ? "superlike" : ""}`}><Icon name={person.type === "superlike" ? "star" : "heart"} size={13} />{person.type === "superlike" ? "Super-like" : "Like"}</span></button><div className="like-card-body"><button className="profile-name-button" type="button" onClick={() => navigate(`/profile/${person.id || person._id}`)}><strong>{person.name}{person.age ? `, ${person.age}` : ""}</strong></button><span>{person.city || "Location not shared"}{person.likedAt ? ` · ${displayDate(person.likedAt)}` : ""}</span><div className="interest-row">{(person.interests || []).slice(0, 2).map((interest) => <span className="interest-pill" key={interest}>{interest}</span>)}</div><div className="like-card-actions">{tab === "received" ? <Button disabled={pending === String(person.id || person._id)} onClick={() => respond(person)}><Icon name="heart" size={15} /> Like back</Button> : <Button variant="soft" disabled={pending === String(person.id || person._id)} onClick={() => remove(person)}>Remove like</Button>}<Button variant="quiet" onClick={() => navigate(`/profile/${person.id || person._id}`)}>View profile</Button></div></div></article>)}</div> : !error && <EmptyState icon="heart" title={tab === "received" ? "No likes just yet" : "You haven’t sent a like yet"} text={tab === "received" ? "When someone likes your profile, you’ll find them here. Keep your profile feeling like you." : "Explore profiles and send a like when someone catches your attention."} action={<Button to="/discover">Explore profiles <Icon name="arrowRight" size={15} /></Button>} />}</div>;
}

export function MatchesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [pending, setPending] = useState(false);
  const { data: matches, loading, error, reload, setData } = useRemote(async () => {
    const { data } = await api.get("/matches");
    return data.matches || [];
  }, "matches");

  useEffect(() => {
    const handleMatchesChanged = () => reload({ silent: true });
    window.addEventListener("heartlink:matches_changed", handleMatchesChanged);
    return () => window.removeEventListener("heartlink:matches_changed", handleMatchesChanged);
  }, [reload]);

  useEffect(() => {
    const handlePresenceUpdate = (event) => {
      const { userId, online } = event.detail || {};
      if (!userId) return;
      setData((currentMatches) => {
        if (!currentMatches) return currentMatches;
        return currentMatches.map((m) => {
          if (String(m.matchedUser?.id || m.matchedUser?._id) === String(userId)) {
            return {
              ...m,
              matchedUser: {
                ...m.matchedUser,
                online: Boolean(online),
              },
            };
          }
          return m;
        });
      });
    };
    window.addEventListener("heartlink:presence_update", handlePresenceUpdate);
    return () => window.removeEventListener("heartlink:presence_update", handlePresenceUpdate);
  }, [setData]);
  const visible = useMemo(() => (matches || []).filter((match) => `${match.matchedUser?.name || ""} ${match.matchedUser?.city || ""}`.toLowerCase().includes(search.trim().toLowerCase())), [matches, search]);
  async function unmatch() {
    setPending(true);
    try { await api.delete(`/matches/${encodeURIComponent(confirming.matchId)}`); toast.success("Match removed"); setConfirming(null); await reload(); }
    catch (requestError) { toast.error(requestError.response?.data?.message || "We could not remove this match."); }
    finally { setPending(false); }
  }
  return <div className="page-content matches-page"><PageHeading eyebrow="A TWO-WAY HELLO" title="Your matches" description="When interest goes both ways, a conversation can begin." action={<Link className="text-link" to="/discover">Discover more <Icon name="arrowRight" size={15} /></Link>} />{error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}{loading && !matches ? <PageSpinner label="Finding your matches" /> : matches?.length ? <><section className="matches-ribbon"><div className="ribbon-heading"><span>YOUR PEOPLE</span><strong>{matches.length} {matches.length === 1 ? "match" : "matches"}</strong></div><div className="match-avatar-strip">{matches.map((match) => <button key={match.matchId} type="button" onClick={() => navigate(`/messages/${match.matchId}`)} aria-label={`Message ${match.matchedUser?.name}`}><Avatar person={match.matchedUser} size="md" /><span>{match.matchedUser?.name?.split(" ")[0]}</span></button>)}</div></section><div className="matches-list-head"><div><h2>Keep the conversation going</h2><p>Every good story starts somewhere.</p></div><label className="member-search compact-search"><Icon name="search" size={16} /><input type="search" placeholder="Find a match" aria-label="Search matches" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><div className="match-list">{visible.map((match) => <article className="match-row" key={match.matchId}><button type="button" className="match-row-main" onClick={() => navigate(`/messages/${match.matchId}`)}><span className="match-row-avatar"><Avatar person={match.matchedUser} size="md" />{match.matchedUser?.online && <i className="online-indicator" />}</span><span className="match-row-copy"><strong>{match.matchedUser?.name}{match.matchedUser?.age ? `, ${match.matchedUser.age}` : ""}</strong><small>{match.lastMessage?.text || "You matched — say hello."}</small></span><span className="match-row-meta">{displayDate(match.lastMessage?.createdAt || match.createdAt)}{match.unreadCount > 0 && <b>{match.unreadCount}</b>}</span></button><button className="match-row-more" aria-label={`More options for ${match.matchedUser?.name}`} type="button" onClick={() => setConfirming(match)}><Icon name="more" size={18} /></button></article>)}</div></> : !error && <EmptyState icon="users" title="Your first match is out there" text="Discover profiles and send a like. A match opens when you both choose to connect." action={<Button to="/discover">Discover people <Icon name="arrowRight" size={15} /></Button>} />}<ConfirmDialog open={Boolean(confirming)} title="Remove this match?" description={`This ends the match with ${confirming?.matchedUser?.name || "this member"}. Their conversation will no longer be available.`} confirmLabel="Remove match" destructive busy={pending} onConfirm={unmatch} onCancel={() => setConfirming(null)} /></div>;
}
