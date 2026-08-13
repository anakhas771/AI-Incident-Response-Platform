from apps.knowledge.services.llm.ollama_gateway import OllamaLLMGateway


def test_ollama_parser_normal_content():
    """a. normal content"""
    gateway = OllamaLLMGateway(base_url="http://localhost")
    content = "Hello"
    assert gateway._clean_content(content) == "Hello"


def test_ollama_parser_complete_think_block():
    """c. complete think block"""
    gateway = OllamaLLMGateway(base_url="http://localhost")
    content = "<think>private reasoning</think>Final answer"
    assert gateway._clean_content(content) == "Final answer"


def test_ollama_parser_real_observed_qwen3_case():
    """d. real observed Qwen3 case"""
    gateway = OllamaLLMGateway(base_url="http://localhost")
    content = "private reasoning\n</think>\n\nOLLAMA_OK"
    assert gateway._clean_content(content) == "OLLAMA_OK"


def test_ollama_parser_only_reasoning():
    """e. content consisting only of reasoning/think content"""
    gateway = OllamaLLMGateway(base_url="http://localhost")
    content = "private reasoning\n</think>"
    assert gateway._clean_content(content) == ""


def test_ollama_parser_empty():
    gateway = OllamaLLMGateway(base_url="http://localhost")
    assert gateway._clean_content("") == ""


def test_ollama_parser_unclosed():
    gateway = OllamaLLMGateway(base_url="http://localhost")
    content = "<think>private reasoning that got cut off"
    assert gateway._clean_content(content) == ""
