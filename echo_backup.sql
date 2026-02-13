--
-- PostgreSQL database dump
--

\restrict 3XsJ0MUBF3EatHPSx0jyzME4U7QVcs3ZLbrNZNNaePEi3bj3dUNfgKTaZU7zCAf

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversation_members; Type: TABLE; Schema: public; Owner: echo
--

CREATE TABLE public.conversation_members (
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.conversation_members OWNER TO echo;

--
-- Name: conversation_reads; Type: TABLE; Schema: public; Owner: echo
--

CREATE TABLE public.conversation_reads (
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    last_read_message_id uuid,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.conversation_reads OWNER TO echo;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: echo
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(10) DEFAULT 'dm'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    disappearing_messages_enabled boolean DEFAULT false,
    disappearing_messages_duration integer DEFAULT 86400,
    CONSTRAINT conversations_type_check CHECK (((type)::text = 'dm'::text))
);


ALTER TABLE public.conversations OWNER TO echo;

--
-- Name: COLUMN conversations.disappearing_messages_enabled; Type: COMMENT; Schema: public; Owner: echo
--

COMMENT ON COLUMN public.conversations.disappearing_messages_enabled IS 'Whether messages in this conversation auto-delete';


--
-- Name: COLUMN conversations.disappearing_messages_duration; Type: COMMENT; Schema: public; Owner: echo
--

COMMENT ON COLUMN public.conversations.disappearing_messages_duration IS 'Duration in seconds before messages disappear (default 24 hours)';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: echo
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message_type character varying(10) NOT NULL,
    text text,
    media_url character varying(500),
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    CONSTRAINT messages_content_check CHECK (((((message_type)::text = 'text'::text) AND (text IS NOT NULL) AND (media_url IS NULL)) OR (((message_type)::text = 'image'::text) AND (media_url IS NOT NULL) AND (text IS NULL)))),
    CONSTRAINT messages_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying])::text[])))
);


ALTER TABLE public.messages OWNER TO echo;

--
-- Name: COLUMN messages.expires_at; Type: COMMENT; Schema: public; Owner: echo
--

COMMENT ON COLUMN public.messages.expires_at IS 'When set, message will be deleted after this timestamp';


--
-- Name: uploads; Type: TABLE; Schema: public; Owner: echo
--

CREATE TABLE public.uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    url character varying(500) NOT NULL,
    content_type character varying(50) NOT NULL,
    size integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT uploads_size_check CHECK (((size > 0) AND (size <= 5242880)))
);


ALTER TABLE public.uploads OWNER TO echo;

--
-- Name: users; Type: TABLE; Schema: public; Owner: echo
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_username_length CHECK ((char_length((username)::text) >= 3))
);


ALTER TABLE public.users OWNER TO echo;

--
-- Data for Name: conversation_members; Type: TABLE DATA; Schema: public; Owner: echo
--

COPY public.conversation_members (conversation_id, user_id, joined_at) FROM stdin;
e764ae52-089a-4c80-aaac-667507b50012	fa6e539e-22bd-4f40-b1fc-0e5a3e1fd4f3	2026-01-22 06:48:20.990594+00
e764ae52-089a-4c80-aaac-667507b50012	d6f18807-2379-4edf-b035-dec734e0b75e	2026-01-22 06:48:20.990594+00
71f2761f-1b32-47d6-8c55-6536ee6b1859	062eca28-4cf0-4aca-a7f4-ab97f944c5ac	2026-01-22 06:55:01.129793+00
71f2761f-1b32-47d6-8c55-6536ee6b1859	21f35fa6-e720-441d-ac9c-ebfef2f66a29	2026-01-22 06:55:01.129793+00
c7a2d7d7-4b78-40f9-8354-c433c5be7fa8	47226538-cbe6-40ba-b44b-af59cc9e96ba	2026-01-22 07:43:53.755572+00
c7a2d7d7-4b78-40f9-8354-c433c5be7fa8	8dc0fb63-fd87-4789-a68a-bda102ef57da	2026-01-22 07:43:53.755572+00
6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	2026-01-22 18:51:52.482767+00
6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	2026-01-22 18:51:52.482767+00
a55b0d87-6882-4f62-afb1-805eb3387950	4cd84bae-309b-452f-a417-b2fb07013fbd	2026-01-23 04:55:08.726008+00
a55b0d87-6882-4f62-afb1-805eb3387950	9cd1d02a-4332-498c-8673-6fc0f6dc56f9	2026-01-23 04:55:08.726008+00
68392353-d21a-4c56-a409-6ecc19c77434	60260973-4e37-440d-a3ef-334500d152f0	2026-01-23 04:57:18.283165+00
68392353-d21a-4c56-a409-6ecc19c77434	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	2026-01-23 04:57:18.283165+00
e985e6b2-4cff-4e3d-9377-1f959770c08e	60260973-4e37-440d-a3ef-334500d152f0	2026-01-23 04:57:29.413448+00
e985e6b2-4cff-4e3d-9377-1f959770c08e	4cd84bae-309b-452f-a417-b2fb07013fbd	2026-01-23 04:57:29.413448+00
14a1c948-2291-4e92-b96c-bd920a67b882	97a5541f-9751-4309-a2f6-e6d54856f7e2	2026-01-23 05:02:23.525916+00
14a1c948-2291-4e92-b96c-bd920a67b882	4cd84bae-309b-452f-a417-b2fb07013fbd	2026-01-23 05:02:23.525916+00
e294f91e-cc0a-4b7f-bab2-18a8bf4126a1	97a5541f-9751-4309-a2f6-e6d54856f7e2	2026-01-23 05:02:49.494099+00
e294f91e-cc0a-4b7f-bab2-18a8bf4126a1	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	2026-01-23 05:02:49.494099+00
d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	2026-01-23 07:20:30.316312+00
d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	2026-01-23 07:20:30.316312+00
4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	2026-01-23 07:20:38.649506+00
4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	2026-01-23 07:20:38.649506+00
6056a2af-ab46-4b00-be37-83f54544be75	97a5541f-9751-4309-a2f6-e6d54856f7e2	2026-01-23 13:37:40.216638+00
6056a2af-ab46-4b00-be37-83f54544be75	9cd1d02a-4332-498c-8673-6fc0f6dc56f9	2026-01-23 13:37:40.216638+00
\.


--
-- Data for Name: conversation_reads; Type: TABLE DATA; Schema: public; Owner: echo
--

COPY public.conversation_reads (conversation_id, user_id, last_read_message_id, updated_at) FROM stdin;
14a1c948-2291-4e92-b96c-bd920a67b882	97a5541f-9751-4309-a2f6-e6d54856f7e2	458ea9a2-c0b6-45be-b7fa-2b45478829cc	2026-01-23 13:49:13.614082+00
68392353-d21a-4c56-a409-6ecc19c77434	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	3f77cc30-9ea1-4a9c-a961-e86be987720d	2026-01-23 13:49:19.919841+00
e294f91e-cc0a-4b7f-bab2-18a8bf4126a1	97a5541f-9751-4309-a2f6-e6d54856f7e2	\N	2026-01-24 00:13:43.482709+00
6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	269d44cf-f03e-4322-a525-f86980764efb	2026-01-27 07:26:54.24799+00
e294f91e-cc0a-4b7f-bab2-18a8bf4126a1	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	cbd2382a-d484-4f83-aa39-258915867680	2026-01-27 07:32:50.123204+00
d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	dfe1dfeb-846d-4649-bf87-b1a83b2f633f	2026-01-27 07:32:50.967183+00
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: echo
--

COPY public.conversations (id, type, created_at, disappearing_messages_enabled, disappearing_messages_duration) FROM stdin;
e764ae52-089a-4c80-aaac-667507b50012	dm	2026-01-22 06:48:20.990594+00	f	86400
71f2761f-1b32-47d6-8c55-6536ee6b1859	dm	2026-01-22 06:55:01.129793+00	f	86400
c7a2d7d7-4b78-40f9-8354-c433c5be7fa8	dm	2026-01-22 07:43:53.755572+00	f	86400
6e194da9-3f82-4d93-a859-e6169770335e	dm	2026-01-22 18:51:52.482767+00	f	86400
a55b0d87-6882-4f62-afb1-805eb3387950	dm	2026-01-23 04:55:08.726008+00	f	86400
68392353-d21a-4c56-a409-6ecc19c77434	dm	2026-01-23 04:57:18.283165+00	f	86400
e985e6b2-4cff-4e3d-9377-1f959770c08e	dm	2026-01-23 04:57:29.413448+00	f	86400
14a1c948-2291-4e92-b96c-bd920a67b882	dm	2026-01-23 05:02:23.525916+00	f	86400
4d07603c-9600-4c0a-85c1-2b35637cad32	dm	2026-01-23 07:20:38.649506+00	f	86400
d178e65e-6566-421c-b62b-3b3824e1f2ba	dm	2026-01-23 07:20:30.316312+00	f	86400
6056a2af-ab46-4b00-be37-83f54544be75	dm	2026-01-23 13:37:40.216638+00	t	300
e294f91e-cc0a-4b7f-bab2-18a8bf4126a1	dm	2026-01-23 05:02:49.494099+00	f	300
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: echo
--

COPY public.messages (id, conversation_id, sender_id, message_type, text, media_url, created_at, expires_at) FROM stdin;
bc1d78a1-d6ee-4e30-aa14-e6eb1e977142	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hi	\N	2026-01-23 04:09:30.354319+00	\N
5d09429b-2b82-4fb0-9121-79a7cfd443bd	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	hi	\N	2026-01-23 04:09:55.227903+00	\N
5de65c04-9a5d-455d-9924-d16bd51618ca	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	hello how are you	\N	2026-01-23 04:10:03.036103+00	\N
28e12dc8-bfd9-4377-86df-f9f36103bb1c	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	kys	\N	2026-01-23 04:10:20.016154+00	\N
38da5aad-1468-4850-afe5-0a53eb2044ae	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	hello	\N	2026-01-23 04:54:40.237423+00	\N
d8477481-afa1-459c-bfca-bc2611864bad	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hi	\N	2026-01-23 04:55:26.207347+00	\N
c4afd8db-85d9-4ce7-8a5f-119cef092b39	68392353-d21a-4c56-a409-6ecc19c77434	60260973-4e37-440d-a3ef-334500d152f0	text	hi ahynie	\N	2026-01-23 04:57:24.344567+00	\N
ea964a9b-8f86-4cff-be39-13c788656927	e985e6b2-4cff-4e3d-9377-1f959770c08e	60260973-4e37-440d-a3ef-334500d152f0	text	hi naynaaa	\N	2026-01-23 04:57:37.119691+00	\N
f6528d2d-146d-445d-92f9-9be5f6120a4f	68392353-d21a-4c56-a409-6ecc19c77434	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	hellooo johnnnnn	\N	2026-01-23 04:58:23.755551+00	\N
1eba35dd-d0ae-44bd-b376-68911e9af752	68392353-d21a-4c56-a409-6ecc19c77434	60260973-4e37-440d-a3ef-334500d152f0	text	hi	\N	2026-01-23 05:01:31.332883+00	\N
3f77cc30-9ea1-4a9c-a961-e86be987720d	68392353-d21a-4c56-a409-6ecc19c77434	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	hi	\N	2026-01-23 05:01:46.49518+00	\N
db0ff802-4b2c-4b73-90ae-4f0a54141488	14a1c948-2291-4e92-b96c-bd920a67b882	97a5541f-9751-4309-a2f6-e6d54856f7e2	text	hi	\N	2026-01-23 05:02:26.329558+00	\N
cbd2382a-d484-4f83-aa39-258915867680	e294f91e-cc0a-4b7f-bab2-18a8bf4126a1	97a5541f-9751-4309-a2f6-e6d54856f7e2	text	hii	\N	2026-01-23 05:02:52.790343+00	\N
7732cf92-6415-4d20-b551-20c91f2cd3af	14a1c948-2291-4e92-b96c-bd920a67b882	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hi	\N	2026-01-23 06:17:43.795955+00	\N
1d2c21df-264a-4a39-b15c-d73e1d9228b5	14a1c948-2291-4e92-b96c-bd920a67b882	4cd84bae-309b-452f-a417-b2fb07013fbd	text	what are you doingggg	\N	2026-01-23 06:17:53.349059+00	\N
c7da8da2-c682-4382-b1e4-4764f6d0ce3b	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	hiiiii	\N	2026-01-23 06:55:27.847239+00	\N
1bf7fd7d-ae2b-4637-a07c-e03d8b046924	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hellooo	\N	2026-01-23 06:55:34.572675+00	\N
796cb33a-f1ca-41c2-840c-09ca1c66e02c	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	anirudh	\N	2026-01-23 06:55:38.009175+00	\N
f12fdd89-85f6-416b-b172-df7573981bed	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	fuck off	\N	2026-01-23 06:55:39.173425+00	\N
3cc65a23-bebd-408f-bba2-25a777fadacc	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	how	\N	2026-01-23 06:55:50.550252+00	\N
7234b007-9b6b-4675-900a-d0c9a73d1629	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	?	\N	2026-01-23 06:55:51.303509+00	\N
b09b7ac1-ab8e-47b2-a639-52d03267de96	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	ohh so ur hosting it in ur lab rn	\N	2026-01-23 06:56:08.688557+00	\N
81294bc4-993d-4567-a9d4-81cb5e42997a	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	I put my laptops ip address that what u put in the envelope file	\N	2026-01-23 06:56:09.069425+00	\N
c13d1c9a-6d8e-4150-be0f-aa888715118f	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	yuhh	\N	2026-01-23 06:56:12.14353+00	\N
b11a1eaf-6d9d-4ba3-8436-003dadef175a	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	ohkk	\N	2026-01-23 06:56:17.412252+00	\N
c131d2ce-e3d3-4916-8337-a25f331686bb	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	sir was like we already have WhatsApp so what's the functionality	\N	2026-01-23 06:57:22.546679+00	\N
06a8736f-868c-41ff-bc3b-108d0813810a	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	what we do it like snapchat	\N	2026-01-23 06:57:26.213408+00	\N
ed79fda2-6ebd-42d2-b288-28774ebca3d6	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	where it deleted after 24 hours	\N	2026-01-23 06:57:35.284033+00	\N
9da5a3d2-3d52-4ad6-bd02-3315585732be	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	snaps how do we add here?	\N	2026-01-23 06:57:36.349237+00	\N
d0db3ba2-3cd9-4d75-b676-c58704f9768c	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	ooooo	\N	2026-01-23 06:57:39.347315+00	\N
cf61618f-3c0e-4d51-82da-c8b22ac7fcd1	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	nice nice	\N	2026-01-23 06:57:40.935673+00	\N
fa42f253-4150-4293-bb88-d4e5b41973a4	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	so like privacy or whaetver	\N	2026-01-23 06:57:52.320644+00	\N
073bccc5-a762-4e9a-a3d1-bf46f3cc6201	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	is the new fucntionality	\N	2026-01-23 06:57:58.163884+00	\N
0e352f8d-ba66-475b-9532-ff2b385627c0	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	old people dont know about snapchat probably	\N	2026-01-23 06:58:06.279761+00	\N
c6bdf5d5-5c7a-426a-a51b-e30c22be4c98	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	oooo yes convert our limitations into a feature lol	\N	2026-01-23 06:58:06.532952+00	\N
10c69937-d0b2-4648-abee-0a0f74ed328a	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	yessir	\N	2026-01-23 06:58:11.759322+00	\N
0818ff7b-d857-452a-9a35-3597e5acd0f4	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	but the messages beed to be stored for 24 hours tho	\N	2026-01-23 06:58:23.672201+00	\N
11537443-8d69-4741-898f-3036a6440913	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	we should also have like where i can tag a message nd respond to it	\N	2026-01-23 06:58:33.570446+00	\N
5df7710f-9ea5-4843-97de-040d9a2201e4	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	but you can text me because of my ip address	\N	2026-01-23 06:58:58.728724+00	\N
1a96d7ea-45bb-407d-ba98-248c5b30c554	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hey bbg	\N	2026-01-23 06:59:58.266454+00	\N
adfa01ae-9055-4543-afa0-ddd227e2fed5	14a1c948-2291-4e92-b96c-bd920a67b882	97a5541f-9751-4309-a2f6-e6d54856f7e2	text	he's listening to everything we're saying	\N	2026-01-23 07:06:33.600856+00	\N
e94c03f0-fbee-4890-b8b0-bbedc120b5aa	14a1c948-2291-4e92-b96c-bd920a67b882	4cd84bae-309b-452f-a417-b2fb07013fbd	text	babyy	\N	2026-01-23 07:06:59.725947+00	\N
057e62a1-dc87-46af-9d0d-7c9193580dac	14a1c948-2291-4e92-b96c-bd920a67b882	4cd84bae-309b-452f-a417-b2fb07013fbd	text	\\wjerew is my hus	\N	2026-01-23 07:07:02.495115+00	\N
b1c6340c-e6ca-46cd-8211-f1fd01eda86c	14a1c948-2291-4e92-b96c-bd920a67b882	97a5541f-9751-4309-a2f6-e6d54856f7e2	text	it's ok i didnt say the main server thing he didnt hear it	\N	2026-01-23 07:07:12.282846+00	\N
13bff209-de3f-4d99-b54b-75ad697ed9e9	14a1c948-2291-4e92-b96c-bd920a67b882	97a5541f-9751-4309-a2f6-e6d54856f7e2	text	since yall have a working project hes worried that yall actually do something good, soo he wants to know ur progress. stop discussing in class completely. or text eachother	\N	2026-01-23 07:07:54.416393+00	\N
d48c2f0a-9c6c-4bc5-b7b9-1ce2d13d28b2	14a1c948-2291-4e92-b96c-bd920a67b882	4cd84bae-309b-452f-a417-b2fb07013fbd	text	ok sir	\N	2026-01-23 07:08:16.598358+00	\N
32a0532b-88cd-4bec-926b-c8652b7352cc	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	helo	\N	2026-01-23 07:20:34.861589+00	\N
1638900b-5615-42cc-98e2-8e8d11070ed3	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	fcku	\N	2026-01-23 07:20:40.762563+00	\N
c8f3017d-d026-47e9-84c4-83e6bc2646de	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	kysss	\N	2026-01-23 07:20:47.098156+00	\N
ee1591fb-728d-4f36-96d1-3863c3e341f4	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	elllllooo	\N	2026-01-23 07:20:51.497066+00	\N
c6030952-b998-4ff0-abed-7ba10ccc6cfa	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	we were thinking we coulkd make it an app	\N	2026-01-23 07:21:16.857516+00	\N
5a7df4c0-2808-44b9-9025-61899393d0ef	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	or is this better	\N	2026-01-23 07:21:20.365314+00	\N
abc56256-d5be-4e50-89ad-e56ef6dfc166	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	this is fine	\N	2026-01-23 07:21:26.496165+00	\N
00dadaac-fcb7-415a-a9b9-afa692caca75	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	again u have to switch to a widnows app framwork or something	\N	2026-01-23 07:21:40.468169+00	\N
acf3d61d-6af2-4870-96f7-f8dbb70cead6	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	taht might be a hassel	\N	2026-01-23 07:21:44.321384+00	\N
7c7620cb-4fc5-4286-849b-b2fda0946606	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	okiee	\N	2026-01-23 07:21:48.279081+00	\N
458ea9a2-c0b6-45be-b7fa-2b45478829cc	14a1c948-2291-4e92-b96c-bd920a67b882	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hello	\N	2026-01-23 07:39:04.359377+00	\N
d059232f-2c85-4f92-a22d-841a35c4ecf3	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	she feels bad	\N	2026-01-23 07:41:18.800766+00	\N
4fdaeb91-fc44-4119-8049-113781b00211	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	when someone asks	\N	2026-01-23 07:41:24.638384+00	\N
7e0f9b81-d921-479a-9a1b-a1577f8f3cf8	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	she doesnt want to lie and say she doesnt have anything	\N	2026-01-23 07:41:38.279608+00	\N
a34ea2d6-b3ba-4419-b5f4-9c26dd697aba	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	but she has to	\N	2026-01-23 07:42:10.515596+00	\N
411ca814-b0dc-4b05-baaa-86d6dfb8cf72	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	bro ppl will always keep an eye on what others are doing and improve based on that	\N	2026-01-23 07:42:39.828767+00	\N
fb7a32f9-3941-4e3d-826f-05fa3d099b97	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	dont give away ur secrets	\N	2026-01-23 07:42:46.588535+00	\N
3042fcac-cd2f-4948-8d37-f0c2a26cc406	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	act dumb	\N	2026-01-23 07:42:49.114286+00	\N
74bff6c6-f4e7-4fdf-b23f-afd888184382	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	dont show anything	\N	2026-01-23 07:42:51.936258+00	\N
33487b39-60c9-427d-8613-40265173df3e	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	or  thyell be like oh their group did so much	\N	2026-01-23 07:43:06.79733+00	\N
2189c3b6-2525-4905-bead-574d4d66a06c	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	i should catch up	\N	2026-01-23 07:43:09.763404+00	\N
7c2ed12c-b9ff-4c2e-b395-908a41c6b1ca	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	u dont have to lie but dont disclose ur project	\N	2026-01-23 07:43:35.222144+00	\N
ee0cd059-01d7-4315-8d10-c3e5702eb1aa	d178e65e-6566-421c-b62b-3b3824e1f2ba	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	its still under development	\N	2026-01-23 07:43:40.058395+00	\N
0cb06bb3-3256-44ca-b99c-097893815bb7	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	niga	\N	2026-01-23 07:44:56.252453+00	\N
77e9004d-7abe-4886-a4a2-2d2b2416a64f	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	niggaaaa	\N	2026-01-23 07:45:43.718772+00	\N
d874ec55-0707-4d10-9085-4ff7394246bb	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	kys	\N	2026-01-23 07:45:45.05386+00	\N
3a44cd03-f523-4b36-81ca-025ae1004718	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	echo	\N	2026-01-23 07:45:48.872771+00	\N
7d8eebbc-14eb-4575-b999-440b31997bf0	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	echo	\N	2026-01-23 07:45:50.685621+00	\N
f0f7065e-d5df-4fcb-b65f-471445de0fef	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	yes so i was saying	\N	2026-01-23 07:46:04.725461+00	\N
6f6b8080-aeab-4898-ac4a-e4f732ffc50a	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	...	\N	2026-01-23 07:46:05.454917+00	\N
ff6cf46a-003e-44a4-bfb3-68a933afa0ab	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	they all so curious cz they feel like they r behing n they think they are better than u so they cant bare to be behind u	\N	2026-01-23 07:47:34.594125+00	\N
1a2d7737-6a3c-4806-b772-6f3b020562e7	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	they keep asking u	\N	2026-01-23 07:48:38.325624+00	\N
0066aa8b-683c-40f4-94a0-c21167dd38da	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hmm	\N	2026-01-23 07:48:41.426591+00	\N
87fe9554-814a-4a9a-b0ff-67021d9a2571	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	but how do i lie to their face	\N	2026-01-23 07:48:48.489761+00	\N
742a239f-5b0c-4f4a-b58a-cdb5d6b5840e	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	say u dont know anything	\N	2026-01-23 07:48:54.561757+00	\N
cd626cc8-8035-4500-93f0-a98380e99a71	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	they literally cant stand that u have good working app already	\N	2026-01-23 07:48:55.719962+00	\N
74153b81-6a66-4e5b-9b48-543f98b1634f	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	just act dumb	\N	2026-01-23 07:48:58.862647+00	\N
e956eabf-a49d-4a23-9639-787ac089ed71	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	look at sam freaking out	\N	2026-01-23 07:49:01.454945+00	\N
e2053114-e6ee-4b88-9232-d6a051c31b58	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	dont lie	\N	2026-01-23 07:49:05.946766+00	\N
5ce80225-d3a5-46de-a155-f4502fd1db98	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	umm	\N	2026-01-23 07:49:06.778166+00	\N
5ea1e95a-3ffc-4161-936f-8c1225cde2f7	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	lie	\N	2026-01-23 07:49:08.6923+00	\N
f1707b6b-eb81-4112-b189-200b0ee2c253	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	but	\N	2026-01-23 07:49:09.440816+00	\N
653162e3-8558-4857-9a33-ebbdc9b81505	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	first make it dumb	\N	2026-01-23 07:49:14.612678+00	\N
cf1bbdbf-5f31-43b4-aaa6-6de03bd4ab31	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	say ntg is done	\N	2026-01-23 07:49:20.677358+00	\N
58f40faf-c155-40fa-a334-55df9d5f7ea1	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	it doesnt work	\N	2026-01-23 07:49:26.759539+00	\N
10bb885a-4bc8-487f-8910-af360db9ad00	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	he asked wht docker are u using	\N	2026-01-23 07:49:33.217285+00	\N
a3779aae-edfe-4622-ad1c-f4bd25ffe9c2	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	say idk	\N	2026-01-23 07:49:34.464787+00	\N
3ab205ef-60f1-4be6-8438-6002113f71cb	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	but brooo  i feel bad for lying	\N	2026-01-23 07:49:53.306222+00	\N
46551299-4082-48bf-a680-9ffddafe7605	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	is ur app done?\nnahh bro its not al that it just looks pretty	\N	2026-01-23 07:50:06.995633+00	\N
7c622234-4e7b-453c-b604-75c4617dc314	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	ur just keeping it to urself	\N	2026-01-23 07:50:08.98387+00	\N
2cf954cb-062d-4374-875b-710df9da54bb	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	\\like i started shivering when he asked stufff	\N	2026-01-23 07:50:36.065914+00	\N
de33ed41-47d2-4d2f-a56c-eac2382a44b5	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	act funny like nahh top secret if they try to look at ur app	\N	2026-01-23 07:50:38.037747+00	\N
ed97f6ab-fded-4843-95d9-3fbc3152be0c	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	im bad at lying m,ann	\N	2026-01-23 07:50:39.829576+00	\N
8bcd9dbe-a6cf-41dd-b0fe-5942d2067770	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	he keeps looking here	\N	2026-01-23 07:50:44.94355+00	\N
c7a59677-c7a9-4839-b0ce-94021b8fd6ce	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	umm be rude	\N	2026-01-23 07:50:52.91716+00	\N
7f745f76-529a-4ffb-849c-1f8ceff621f6	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hmm ok ill tell secret	\N	2026-01-23 07:50:57.523424+00	\N
aa937bd1-1cad-4986-9b63-1fda88170a7c	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	before they get to ask any questions itself	\N	2026-01-23 07:51:02.39695+00	\N
6137baed-8e69-431f-b6f0-48a577579a4c	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	rude ah	\N	2026-01-23 07:51:04.244117+00	\N
7569ce1a-810f-48db-9ef4-1ba4c23a4396	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	me ah???	\N	2026-01-23 07:51:07.146798+00	\N
066552a6-0e9f-44d7-97bb-55dba16d623a	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	say ur mom or something	\N	2026-01-23 07:51:07.153557+00	\N
53b5cb00-c9e3-4f80-ac4e-b00f7c50c853	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	ooo i can do that	\N	2026-01-23 07:51:15.197012+00	\N
64659272-84d4-4ce9-8c82-1cc478fd7a6e	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	sam said docker how many say something like ur mom number	\N	2026-01-23 07:51:23.475306+00	\N
461dd76c-39cd-4a08-bdd0-9bba006999ff	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	is ur app done\nis ur mom done	\N	2026-01-23 07:51:32.679278+00	\N
a5ea0e97-ba3b-4001-a769-1c58d386fbfb	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	say I did everything	\N	2026-01-23 07:51:35.672772+00	\N
72ed284e-ba64-486f-9914-641cac77ce48	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	just cut it off	\N	2026-01-23 07:51:37.902749+00	\N
e8912efb-b8e7-437e-9e46-aa34ebc815e3	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	so you dont know anything	\N	2026-01-23 07:51:41.455096+00	\N
2b171169-4860-4399-beb7-a87db10c2622	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	okok	\N	2026-01-23 07:51:42.94488+00	\N
b468e833-6933-4942-9931-d9dfa9886cf1	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	and it has issues still	\N	2026-01-23 07:51:46.671089+00	\N
bdfda0b7-ea88-402d-b054-878284ac02de	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	yes then they will ask u na	\N	2026-01-23 07:51:56.493544+00	\N
5c861f89-5459-4d06-ae86-247042bb6e64	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	if they keep pressing on say ahhh nothing is done	\N	2026-01-23 07:51:58.618194+00	\N
4a0e59f7-0fc4-401a-b011-ce7430d1cedb	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	ill deal with them bbg	\N	2026-01-23 07:52:01.271971+00	\N
2038cb8f-bfec-4721-a025-e10032aed55a	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	or something vague	\N	2026-01-23 07:52:01.882016+00	\N
51757225-81ae-4267-9b40-bfea6266baa0	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	i can be rude	\N	2026-01-23 07:52:05.3555+00	\N
1b4c017c-eae2-41b9-9468-bda0705f9e3f	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	this is tooo much pressureee	\N	2026-01-23 07:52:10.298774+00	\N
fdc5b185-dc71-4118-849a-88e92b472b38	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	ahhhh	\N	2026-01-23 07:52:11.944518+00	\N
8652de86-83c8-4e78-8fac-e7e826b9e44e	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	lol u sure?	\N	2026-01-23 07:52:17.447077+00	\N
310c8777-b3a0-4199-8d48-0c7e8b8850fe	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	this is all a competition bro trust me they dont mean anything good	\N	2026-01-23 07:52:17.560025+00	\N
e2f20ee7-7eae-4a7f-9706-aa92323a5973	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	just put it on me	\N	2026-01-23 07:52:18.474879+00	\N
61afcca5-1d9f-4ccd-9b01-7fafeab74a3f	6e194da9-3f82-4d93-a859-e6169770335e	4cd84bae-309b-452f-a417-b2fb07013fbd	text	ull be ok	\N	2026-01-23 07:52:19.603743+00	\N
269d44cf-f03e-4322-a525-f86980764efb	6e194da9-3f82-4d93-a859-e6169770335e	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	yessir	\N	2026-01-23 07:52:31.33895+00	\N
d57492dc-bb3b-4018-8248-1a53c7ee6471	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	hmm okok	\N	2026-01-23 07:52:34.004878+00	\N
8f611a1c-6867-4a2b-b1af-61337e48a010	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	or say ur working ur jon	\N	2026-01-23 07:52:44.927846+00	\N
9a6d96cf-9aa6-4b30-a619-8ba68ffa65c1	4d07603c-9600-4c0a-85c1-2b35637cad32	0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	text	job	\N	2026-01-23 07:52:46.186399+00	\N
7e2483b4-2a51-44f5-8a2f-b32b22de8773	4d07603c-9600-4c0a-85c1-2b35637cad32	4cd84bae-309b-452f-a417-b2fb07013fbd	text	ohh ook\\	\N	2026-01-23 07:52:56.61183+00	\N
6ab99cca-a0b7-42e7-aa63-295fac93cbb3	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	hello	\N	2026-01-27 07:06:35.192457+00	\N
71325c00-8a4b-4764-a56d-55055155f778	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	elo	\N	2026-01-27 07:26:50.943904+00	\N
10d7cb6b-a01e-402e-ae59-ea845ef71ebb	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	saar	\N	2026-01-27 07:27:01.308136+00	\N
71b3042b-f430-4b87-b707-88137c974d08	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	wyddd saar	\N	2026-01-27 07:27:26.673348+00	\N
25c063a6-bcd7-4d1b-95a0-3f9a73e4e8e1	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	ello	\N	2026-01-27 07:28:50.225379+00	\N
7da8ea82-75b6-41dd-b435-4aaca1133b6e	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	ello	\N	2026-01-27 07:28:51.110676+00	\N
11f5eeeb-475e-46f4-9bb3-030545137de0	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	looser	\N	2026-01-27 07:28:52.873937+00	\N
b207e0a4-01b8-4f1f-9c6f-caefd20cf393	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	ellllloo	\N	2026-01-27 07:28:54.854192+00	\N
61c9c364-68cc-4fdd-95ea-a795075da572	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	what are you doingggggg	\N	2026-01-27 07:29:02.536597+00	\N
dfe1dfeb-846d-4649-bf87-b1a83b2f633f	d178e65e-6566-421c-b62b-3b3824e1f2ba	be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	text	elloo	\N	2026-01-27 07:29:04.203771+00	\N
\.


--
-- Data for Name: uploads; Type: TABLE DATA; Schema: public; Owner: echo
--

COPY public.uploads (id, user_id, url, content_type, size, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: echo
--

COPY public.users (id, username, email, password_hash, created_at) FROM stdin;
09895c72-2379-4f1d-9f6b-07a01afd24a0	testuser	test@example.com	$2a$10$M7O9UiawriDi3VXDXZB1QuR0pVDC0rDNaCUn850wx.7WnP5k5SMW6	2026-01-21 17:29:17.876873+00
be8a2a88-d51f-49bb-8591-8b2be8cc7ed8	ahynie	ahanyam3@gmail.com	$2a$10$GtTDctCveoWo4FOzWPBKVe25QvWmdAp5AeapesN/WinEC0YO3hK0m	2026-01-21 17:55:39.33296+00
4cd84bae-309b-452f-a417-b2fb07013fbd	nayana	nayana@gmail.com	$2a$10$tLaU2TKZ2H6G/SXnyDpNne3Eq4dag1lukIDXjhkwxvP0b/uGPZAsq	2026-01-22 02:03:28.653862+00
045976b8-08db-451f-a548-322566ce2734	alice	alice@example.com	$2a$10$NDOmGdKUWnsNQrFrsjyS7ezTHmpKadmYXy2h2BnF23tRPO9JTyjEK	2026-01-22 06:00:20.374311+00
9cd1d02a-4332-498c-8673-6fc0f6dc56f9	bob	bob@example.com	$2a$10$UaDOPhCKgJQSxF.WoJ.THeo6rMgeTmVuvPOMc.DnN6rDc1vevNl9S	2026-01-22 06:00:39.206343+00
fa6e539e-22bd-4f40-b1fc-0e5a3e1fd4f3	user1_20260122121820	user1_20260122121820@example.com	hash	2026-01-22 06:48:20.979521+00
d6f18807-2379-4edf-b035-dec734e0b75e	user2_20260122121820	user2_20260122121820@example.com	hash	2026-01-22 06:48:20.982748+00
062eca28-4cf0-4aca-a7f4-ab97f944c5ac	userA_20260122122501	userA_20260122122501@example.com	hash	2026-01-22 06:55:01.126293+00
21f35fa6-e720-441d-ac9c-ebfef2f66a29	userB_20260122122501	userB_20260122122501@example.com	hash	2026-01-22 06:55:01.129116+00
47226538-cbe6-40ba-b44b-af59cc9e96ba	mandy	mandy@example.com	$2a$10$DlGFWknE3PvL59BcLkjnruVCGFyzDHVtSS9H2QwM6BjGHi4qPXEDy	2026-01-22 07:40:57.043918+00
8dc0fb63-fd87-4789-a68a-bda102ef57da	fae	fae@example.com	$2a$10$q4J0YpmQUHV2lgYOxqOf5OpQYUraIFVNrmCEpsxXX68AX/cWNOova	2026-01-22 07:41:54.730763+00
60260973-4e37-440d-a3ef-334500d152f0	john	john@gmail.com	$2a$10$9xbHGvniz3G8wfGrlytMleax3Rc9ncE2c6aPDGlRcpFdm/048weQu	2026-01-23 04:57:12.858573+00
97a5541f-9751-4309-a2f6-e6d54856f7e2	test	test@gmail.com	$2a$10$k1X7ehmJbSFxEk20gn.TAObcDj/c3g4dc5ZiiYR5wKydiygepKHdK	2026-01-23 05:02:19.455952+00
0a7a6d7e-d9b1-4253-8d04-d86c1ed4c449	anirudh	a@mail.com	$2a$10$p28ZWKRi1X4nwWAcsWdXv.F7H9WmbQO0b5zdNSH6NY3C.N1zYG/PG	2026-01-23 07:20:22.995692+00
\.


--
-- Name: conversation_members conversation_members_pkey; Type: CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_pkey PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversation_reads conversation_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.conversation_reads
    ADD CONSTRAINT conversation_reads_pkey PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: idx_conversation_members_conversation_id; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_conversation_members_conversation_id ON public.conversation_members USING btree (conversation_id);


--
-- Name: idx_conversation_members_user_id; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_conversation_members_user_id ON public.conversation_members USING btree (user_id);


--
-- Name: idx_conversation_reads_user_id; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_conversation_reads_user_id ON public.conversation_reads USING btree (user_id);


--
-- Name: idx_messages_conversation_created; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at DESC);


--
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_expires_at; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_messages_expires_at ON public.messages USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_uploads_created_at; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_uploads_created_at ON public.uploads USING btree (created_at DESC);


--
-- Name: idx_uploads_user_id; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_uploads_user_id ON public.uploads USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: echo
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: conversation_members conversation_members_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_members conversation_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversation_reads conversation_reads_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.conversation_reads
    ADD CONSTRAINT conversation_reads_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_reads conversation_reads_last_read_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.conversation_reads
    ADD CONSTRAINT conversation_reads_last_read_message_id_fkey FOREIGN KEY (last_read_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: conversation_reads conversation_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.conversation_reads
    ADD CONSTRAINT conversation_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: uploads uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: echo
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 3XsJ0MUBF3EatHPSx0jyzME4U7QVcs3ZLbrNZNNaePEi3bj3dUNfgKTaZU7zCAf

