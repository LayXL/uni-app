import importedBridge from "@vkontakte/vk-bridge"

type VkBridge = typeof importedBridge
type InteropBridge = VkBridge & { default?: VkBridge }

const bridgeModule = importedBridge as InteropBridge
const bridge =
	typeof bridgeModule.send === "function"
		? bridgeModule
		: (bridgeModule.default ?? bridgeModule)

export default bridge
