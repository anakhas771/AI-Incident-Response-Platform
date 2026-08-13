def filter_think_stream(chunk_iterator):
    in_think = False
    buffer = ""
    for chunk in chunk_iterator:
        buffer += chunk
        while True:
            if not in_think:
                start_idx = buffer.find("<think>")
                if start_idx != -1:
                    if start_idx > 0:
                        yield buffer[:start_idx]
                    in_think = True
                    buffer = buffer[start_idx + len("<think>"):]
                else:
                    last_lt = buffer.rfind("<")
                    if last_lt != -1 and len(buffer) - last_lt < len("<think>"):
                        if "<think>".startswith(buffer[last_lt:]):
                            if last_lt > 0:
                                yield buffer[:last_lt]
                            buffer = buffer[last_lt:]
                            break
                    yield buffer
                    buffer = ""
                    break
            else:
                end_idx = buffer.find("</think>")
                if end_idx != -1:
                    in_think = False
                    buffer = buffer[end_idx + len("</think>"):]
                else:
                    last_lt = buffer.rfind("<")
                    if last_lt != -1 and len(buffer) - last_lt < len("</think>"):
                        if "</think>".startswith(buffer[last_lt:]):
                            buffer = buffer[last_lt:]
                            break
                    buffer = ""
                    break

chunks = ["Hel", "lo <t", "hin", "k>t", "his is t", "hinking</t", "hink> an", "d this ", "is not."]
res = list(filter_think_stream(chunks))
print("".join(res))
