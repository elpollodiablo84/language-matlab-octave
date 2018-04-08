%% Function
function out = fun(in, index) % Comment
    persistent a index c% Comment
    if isempty(a)
        a = 1;
    end

    test = 3;

    in = in.^a;
    index = index + 1;
    a = a*3;

    %% Test comment in function
    out = in(index);
end
