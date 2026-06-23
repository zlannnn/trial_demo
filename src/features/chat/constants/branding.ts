export const BRAND = {
  name: "J-Ghost",
  company: "Jurin",
  tagline: "生成式 AI · 自然语音代理",
  scenario: "学资保险 · 契约确认",
  scenarioDesc: "主动确认契约信息，实时入库并追踪确认进度",
} as const;

export const DEMO_PROMPTS = [
  "您好，我是张先生，想确认学资保险的合同细节。",
  "等等，你说错了，受益人应该是我妻子。",
  "这个每年要交多少钱？保到几岁？",
  "我叫李小明，生日1990年3月15日，电话13812345678。",
] as const;

export const CAPABILITIES = [
  {
    title: "主动契约确认",
    desc: "逐项核对姓名、保费、受益人等关键信息并入库",
    icon: "wave",
  },
  {
    title: "打断与纠错",
    desc: "客户说「等等」「你说错了」时即时停住并调整",
    icon: "interrupt",
  },
  {
    title: "非脚本智能应答",
    desc: "生成式 AI 实时组织语言，回答临时提问",
    icon: "brain",
  },
  {
    title: "业务系统联动",
    desc: "通话中实时入库，右侧任务清单同步打勾",
    icon: "database",
  },
] as const;

export const TOOL_LABELS: Record<string, string> = {
  createUserProfile: "建立投保人档案",
  updateUserProfile: "更新契约信息",
  getUserProfile: "调取保单资料",
  completeContractConfirmation: "完成契约确认",
  createConversation: "发起外呼会话",
  saveMessage: "写入通话记录",
  searchConversationHistory: "检索历史通话",
};
