import { definePluginSettings } from "@api/Settings";
import definePlugin, { StartAt, OptionType } from "@utils/types";

const badgesData = [
    {
        "id": "custom_badge1",
        "description": "Custom Badge",
        "image": "",
        "link": "https://duzelicem.com/"
    },
    {
        "id": "staff",
        "description": "Discord Staff",
        "icon": "5e74e9b61934fc1f67c65515d1f7e60d",
        "link": "https://discord.com/company"
    },
    {
        "id": "partner",
        "description": "Partnered Server Owner",
        "icon": "3f9748e53446a137a052f3454e2de41e",
        "link": "https://discord.com/partners"
    },
    {
        "id": "certified_moderator",
        "description": "Moderator Programs Alumni",
        "icon": "fee1624003e2fee35cb398e125dc479b",
        "link": "https://discord.com/safety"
    },
    {
        "id": "hypesquad",
        "description": "HypeSquad Events",
        "icon": "bf01d1073931f921909045f3a39fd264",
        "link": "https://discord.com/hypesquad"
    },
    {
        "id": "bug_hunter",
        "description": "Bug Hunter",
        "icon": "2717692c7dca7289b35297368a940dd0",
        "link": "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs"
    },
    {
        "id": "golden_bug_hunter",
        "description": "Bug Hunter",
        "icon": "848f79194d4be5ff5f81505cbd0ce1e6",
        "link": "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs"
    },
    {
        "id": "active_developer",
        "description": "Active Developer",
        "icon": "6bdc42827a38498929a4920da12695d9",
        "link": "https://support-dev.discord.com/hc/en-us/articles/10113997751447-Active-Developer-Badge?ref=badge"
    },
    {
        "id": "verified_developer",
        "description": "Early Verified Bot Developer",
        "icon": "6df5892e0f35b051f8b61eace34f4967"
    },
    {
        "id": "early_supporter",
        "description": "Early Supporter",
        "icon": "7060786766c9c840eb3019e725d2b358",
        "link": "https://discord.com/settings/premium"
    }
];

const settings = definePluginSettings({
    ...Object.fromEntries(
        badgesData.map(badge => [
            badge.description,
            {
                type: OptionType.BOOLEAN,
                default: false,
                description: `Get ${badge.description} badge`,
                restartNeeded: false
            }
        ])
    ),
    "Bug Hunter": {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Get Bug Hunter badge",
        restartNeeded: false
    },
    "Bug Hunter Selection": {
        type: OptionType.SELECT,
        default: "bug_hunter",
        disabled: () => settings.store["Bug Hunter"] !== true,
        description: "Select your Bug Hunter badge",
        options: [
            { value: "bug_hunter", label: "Bug Hunter" },
            { value: "golden_bug_hunter", label: "Golden Bug Hunter" }
        ],
        restartNeeded: false
    },
    "Custom Badge": {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Get Custom Badge",
        restartNeeded: false
    },
    "Custom Badge Name": {
        description: "Give your Custom Badge a name",
        type: OptionType.STRING,
        default: "Cool Person",
        disabled: () => settings.store["Custom Badge"] !== true,
        restartNeeded: false
    },
    "Custom Badge Image": {
        description: "Enter an image URL for your badge",
        type: OptionType.STRING,
        default: "https://cdn.discordapp.com/emojis/1243992575300603936.png",
        disabled: () => settings.store["Custom Badge"] !== true,
        restartNeeded: false
    }
});

const ardaPluginStart = () => {
    console.log("Plugin has been loaded successfully.");

    setTimeout(async () => {
        const store = Vencord.Webpack.findStore("UserProfileStore");
        let originalGetUserProfile = store.getUserProfile;
        let originalBadges: any[] = [];
        let profileUpdateInterval: NodeJS.Timeout | null = null;
        const sortMap = new Map(badgesData.map((badge, index) => [badge.description, index]));

        const selectedBadges: Set<string> = new Set();

        const updateSelectedBadges = () => {
            selectedBadges.clear();

            if (settings.store["Bug Hunter"]) {
                const bugHunterSelection = settings.store["Bug Hunter Selection"];
                if (bugHunterSelection) {
                    selectedBadges.add(bugHunterSelection);
                }
            }

            badgesData.forEach(badge => {
                if (settings.store[badge.description] && badge.id !== "bug_hunter" && badge.id !== "golden_bug_hunter") {
                    selectedBadges.add(badge.id);
                }
            });

            if (settings.store["Custom Badge"]) {
                badgesData.find(badge => badge.id === "custom_badge1")!.description = settings.store["Custom Badge Name"];
                badgesData.find(badge => badge.id === "custom_badge1")!.image = settings.store["Custom Badge Image"];
                selectedBadges.add("custom_badge1");
            }
        };

        const updateProfile = () => {
            store.getUserProfile = function (id) {
                const r = originalGetUserProfile.apply(this, arguments);
                if (r && id === Vencord.Webpack.Common.UserStore.getCurrentUser()?.id) {
                    if (!originalBadges.length) {
                        originalBadges = r.badges;
                    }

                    const existingBadges = new Set(r.badges.map(badge => badge.id));

                    const newBadges = badgesData.filter(badge => selectedBadges.has(badge.id) && !existingBadges.has(badge.id));

                    const remainingBadges = r.badges.filter(badge => selectedBadges.has(badge.id) || !badgesData.some(b => b.id === badge.id));

                    const sortedBadges = [
                        ...newBadges,
                        ...remainingBadges
                    ].sort((a, b) => {
                        const descA = a.description || '';
                        const descB = b.description || '';
                        const indexA = sortMap.get(descA) ?? Infinity;
                        const indexB = sortMap.get(descB) ?? Infinity;
                        return indexA - indexB;
                    });

                    r.badges = sortedBadges;
                }
                return r;
            };
        };

        console.log("look at your profile and see those cool badges");
        profileUpdateInterval = setInterval(() => {
            updateSelectedBadges();
            updateProfile();
        }, 1000);
        
        updateSelectedBadges();
        updateProfile();

    }, 3000);
};

export default definePlugin({
    name: "AmınakeBadges",
    description: "Amınakeee - Get the badge you want",
    authors: [{ name: "arda", id: 647900446664687617n }],
    
    startAt: StartAt.Init,

    start() {
        console.log("amınake is loading...");
        ardaPluginStart();
    },

    stop() {
        console.log("amınake stopped");
        const store = Vencord.Webpack.findStore("UserProfileStore");

        if (store) {
            if (profileUpdateInterval) {
                clearInterval(profileUpdateInterval);
                profileUpdateInterval = null;
            }
            if (originalBadges.length && originalGetUserProfile) {
                store.getUserProfile = function (id) {
                    const r = originalGetUserProfile.apply(this, arguments);
                    if (r && id === Vencord.Webpack.Common.UserStore.getCurrentUser()?.id) {
                        r.badges = originalBadges;
                    }
                    return r;
                };
            }
        }
    },

    settings
});
